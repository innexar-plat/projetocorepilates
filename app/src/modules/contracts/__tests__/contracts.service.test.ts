import { contractsService } from '../services/contracts.service';
import { contractsRepository } from '../repositories/contracts.repository';
import { db } from '@/lib/db';
import * as minio from '@/lib/minio';
import { logger } from '@/lib/logger';
import { NotFoundError, ConflictError, ForbiddenError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../repositories/contracts.repository');
jest.mock('@/lib/db', () => ({ db: { user: { findUnique: jest.fn() } } }));
jest.mock('@/lib/minio', () => ({ uploadFile: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const repoMock = jest.mocked(contractsRepository);
const dbMock = jest.mocked(db);
const uploadFileMock = jest.mocked(minio.uploadFile);
const loggerMock = jest.mocked(logger);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const userId = 'user-001';
const clientProfileId = 'profile-001';

const unsignedContract = {
  id: 'contract-001',
  userId,
  clientProfileId,
  version: '1.0',
  content: 'LEGAL CONTRACT CONTENT',
  isSigned: false,
  signedAt: null,
  signatureData: null,
  ipAddress: null,
  userAgent: null,
  fileUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  clientProfile: { id: clientProfileId },
};

const signedContract = {
  ...unsignedContract,
  isSigned: true,
  signedAt: new Date(),
  signatureData: 'Ana Paula Ferreira',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('contractsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getByUserId ────────────────────────────────────────────────────────────

  describe('getByUserId', () => {
    it('returns contract when it exists', async () => {
      repoMock.findByUserId.mockResolvedValue(unsignedContract as never);

      const result = await contractsService.getByUserId(userId);

      expect(result).toEqual(unsignedContract);
    });

    it('throws NotFoundError when no contract exists', async () => {
      repoMock.findByUserId.mockResolvedValue(null);

      await expect(contractsService.getByUserId(userId)).rejects.toThrow(NotFoundError);
    });
  });

  // ── createForUser ──────────────────────────────────────────────────────────

  describe('createForUser', () => {
    it('creates contract and generates legal content', async () => {
      repoMock.findByUserId.mockResolvedValue(null);
      (dbMock.user.findUnique as jest.Mock).mockResolvedValue({
        name: 'Ana Paula',
        email: 'ana@example.com',
      });
      repoMock.create.mockResolvedValue(unsignedContract as never);

      const result = await contractsService.createForUser(userId, clientProfileId);

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clientProfileId,
          userId,
          version: '1.0',
          content: expect.stringContaining('Ana Paula'),
        }),
      );
      expect(result).toEqual(unsignedContract);
    });

    it('is idempotent — returns existing contract if present', async () => {
      repoMock.findByUserId.mockResolvedValue(unsignedContract as never);

      const result = await contractsService.createForUser(userId, clientProfileId);

      expect(repoMock.create).not.toHaveBeenCalled();
      expect(result).toEqual(unsignedContract);
    });

    it('throws NotFoundError when user does not exist', async () => {
      repoMock.findByUserId.mockResolvedValue(null);
      (dbMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(contractsService.createForUser(userId, clientProfileId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('includes client email in generated content', async () => {
      repoMock.findByUserId.mockResolvedValue(null);
      (dbMock.user.findUnique as jest.Mock).mockResolvedValue({
        name: 'Carlos Mendes',
        email: 'carlos@pilates.com',
      });
      repoMock.create.mockResolvedValue(unsignedContract as never);

      await contractsService.createForUser(userId, clientProfileId);

      const createCall = repoMock.create.mock.calls[0][0];
      expect(createCall.content).toContain('carlos@pilates.com');
    });
  });

  // ── sign ──────────────────────────────────────────────────────────────────

  describe('sign', () => {
    const signDto = { signatureData: 'Ana Paula Ferreira' };
    const ip = '192.168.1.1';
    const ua = 'Mozilla/5.0 (Test)';

    it('signs the contract and records signature evidence', async () => {
      repoMock.findByUserId.mockResolvedValue(unsignedContract as never);
      repoMock.sign.mockResolvedValue(signedContract as never);
      uploadFileMock.mockResolvedValue({ url: 'http://storage/contracts/contract-001.txt', filename: 'contracts/contract-001.txt' });

      const result = await contractsService.sign(userId, signDto, ip, ua);

      expect(repoMock.sign).toHaveBeenCalledWith(unsignedContract.id, {
        signatureData: signDto.signatureData,
        ipAddress: ip,
        userAgent: ua,
      });
      expect(result).toEqual(signedContract);
    });

    it('throws NotFoundError when no contract exists', async () => {
      repoMock.findByUserId.mockResolvedValue(null);

      await expect(contractsService.sign(userId, signDto, ip, ua)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws ConflictError when contract is already signed', async () => {
      repoMock.findByUserId.mockResolvedValue(signedContract as never);

      await expect(contractsService.sign(userId, signDto, ip, ua)).rejects.toThrow(
        ConflictError,
      );
    });

    it('throws ForbiddenError when contract belongs to different user', async () => {
      repoMock.findByUserId.mockResolvedValue({
        ...unsignedContract,
        userId: 'other-user',
      } as never);

      await expect(contractsService.sign(userId, signDto, ip, ua)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('stores archived contract in MinIO asynchronously (best-effort)', async () => {
      repoMock.findByUserId.mockResolvedValue(unsignedContract as never);
      repoMock.sign.mockResolvedValue(signedContract as never);
      uploadFileMock.mockResolvedValue({
        url: 'http://storage/contracts/contract-001.txt',
        filename: 'contracts/contract-001.txt',
      });

      await contractsService.sign(userId, signDto, ip, ua);

      // Allow the async archive to run
      await new Promise((res) => setTimeout(res, 10));

      expect(uploadFileMock).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringContaining('contract-001'),
        'contracts',
        'text/plain',
      );
    });

    it('logs archive error and still returns signed contract', async () => {
      repoMock.findByUserId.mockResolvedValue(unsignedContract as never);
      repoMock.sign.mockResolvedValue(signedContract as never);
      const archiveSpy = jest
        .spyOn(contractsService, '_archiveSigned')
        .mockRejectedValueOnce(new Error('archive failed'));

      const result = await contractsService.sign(userId, signDto, ip, ua);

      await new Promise((res) => setTimeout(res, 10));

      expect(result).toEqual(signedContract);
      expect(loggerMock.error).toHaveBeenCalled();
      archiveSpy.mockRestore();
    });
  });

  // ── _archiveSigned ─────────────────────────────────────────────────────────

  describe('_archiveSigned', () => {
    it('uploads contract text to MinIO and updates fileUrl', async () => {
      const fileUrl = 'http://storage/contracts/contract-001.txt';
      uploadFileMock.mockResolvedValue({ url: fileUrl, filename: 'contracts/contract-001.txt' });
      repoMock.updateFileUrl.mockResolvedValue(undefined as never);

      await contractsService._archiveSigned(
        'contract-001',
        userId,
        'CONTRACT CONTENT HERE',
        'Ana Paula Ferreira',
      );

      expect(uploadFileMock).toHaveBeenCalledWith(
        expect.any(Buffer),
        'contract-contract-001.txt',
        'contracts',
        'text/plain',
      );
      expect(repoMock.updateFileUrl).toHaveBeenCalledWith('contract-001', fileUrl);
    });

    it('includes typed name in archived text', async () => {
      uploadFileMock.mockResolvedValue({ url: 'http://s/c/f.txt', filename: 'c/f.txt' });
      repoMock.updateFileUrl.mockResolvedValue(undefined as never);

      await contractsService._archiveSigned(
        'contract-001',
        userId,
        'CONTRACT',
        'Carlos Roberto Mendes',
      );

      const uploadedBuffer: Buffer = uploadFileMock.mock.calls[0][0] as Buffer;
      const text = uploadedBuffer.toString('utf-8');
      expect(text).toContain('Carlos Roberto Mendes');
      expect(text).toContain('contract-001');
    });
  });
});
