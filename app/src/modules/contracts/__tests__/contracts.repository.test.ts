import { db } from '@/lib/db';
import { contractsRepository } from '../repositories/contracts.repository';

const mockDb = jest.mocked(db);

const baseContract = {
  id: 'contract-uuid-1',
  userId: 'user-uuid-1',
  clientProfileId: 'profile-uuid-1',
  version: '1.0',
  content: 'Terms and conditions...',
  isSigned: false,
  signedAt: null,
  signatureData: null,
  ipAddress: null,
  userAgent: null,
  fileUrl: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('contractsRepository', () => {
  // ── findByUserId ─────────────────────────────────────────────────────────────
  describe('findByUserId', () => {
    it('calls db.contract.findFirst with userId', async () => {
      mockDb.contract.findFirst.mockResolvedValue(baseContract);
      const result = await contractsRepository.findByUserId('user-uuid-1');
      expect(mockDb.contract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid-1' } }),
      );
      expect(result).toEqual(baseContract);
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.contract.findUnique with id', async () => {
      mockDb.contract.findUnique.mockResolvedValue(baseContract);
      const result = await contractsRepository.findById('contract-uuid-1');
      expect(mockDb.contract.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'contract-uuid-1' } }),
      );
      expect(result).toEqual(baseContract);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.contract.create with contract data', async () => {
      mockDb.contract.create.mockResolvedValue(baseContract);
      const data = {
        clientProfileId: 'profile-uuid-1',
        userId: 'user-uuid-1',
        version: '1.0',
        content: 'Terms...',
      };
      const result = await contractsRepository.create(data);
      expect(mockDb.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({ data }),
      );
      expect(result).toEqual(baseContract);
    });
  });

  // ── sign ─────────────────────────────────────────────────────────────────────
  describe('sign', () => {
    it('updates contract as signed with signature data', async () => {
      const signed = {
        ...baseContract,
        isSigned: true,
        signatureData: 'Maria Silva',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        signedAt: new Date(),
      };
      mockDb.contract.update.mockResolvedValue(signed);
      const result = await contractsRepository.sign('contract-uuid-1', {
        signatureData: 'Maria Silva',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(mockDb.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'contract-uuid-1' },
          data: expect.objectContaining({
            isSigned: true,
            signatureData: 'Maria Silva',
            ipAddress: '127.0.0.1',
          }),
        }),
      );
      expect(result).toEqual(signed);
    });
  });

  // ── updateFileUrl ─────────────────────────────────────────────────────────────
  describe('updateFileUrl', () => {
    it('calls db.contract.update with fileUrl', async () => {
      mockDb.contract.update.mockResolvedValue({ ...baseContract, fileUrl: 'https://s3.example.com/contract.pdf' });
      await contractsRepository.updateFileUrl('contract-uuid-1', 'https://s3.example.com/contract.pdf');
      expect(mockDb.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'contract-uuid-1' },
          data: { fileUrl: 'https://s3.example.com/contract.pdf' },
        }),
      );
    });
  });
});
