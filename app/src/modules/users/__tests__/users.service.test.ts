import { usersService } from '../services/users.service';
import { usersRepository } from '../repositories/users.repository';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import * as bcryptjs from 'bcryptjs';
import * as crypto from 'crypto';
import { sendEmail } from '@/lib/resend';

// ─── Mock dependencies ────────────────────────────────────────────────────────
jest.mock('../repositories/users.repository');
jest.mock('bcryptjs');
jest.mock('crypto');
jest.mock('@/lib/resend');

const mockRepo = jest.mocked(usersRepository);
const mockHash = jest.mocked(bcryptjs.hash);
const mockCompare = jest.mocked(bcryptjs.compare);
const mockRandomBytes = jest.mocked(crypto.randomBytes);
const mockSendEmail = jest.mocked(sendEmail);

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseUser = {
  id: 'user-uuid-1',
  name: 'Maria Silva',
  email: 'maria@email.com',
  phone: null,
  role: 'CLIENT' as const,
  avatarUrl: null,
  stripeCustomerId: null,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
};

const userWithPassword = { ...baseUser, passwordHash: 'hashed_password' };

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('usersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getById ──────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('returns user when found', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      const result = await usersService.getById('user-uuid-1');
      expect(result).toEqual(baseUser);
      expect(mockRepo.findById).toHaveBeenCalledWith('user-uuid-1');
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(usersService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ── getByEmail ───────────────────────────────────────────────────────────────
  describe('getByEmail', () => {
    it('returns user when found', async () => {
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      const result = await usersService.getByEmail('maria@email.com');
      expect(result).toEqual(userWithPassword);
    });

    it('throws NotFoundError when email not found', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      await expect(usersService.getByEmail('unknown@email.com')).rejects.toThrow(NotFoundError);
    });
  });

  // ── list ─────────────────────────────────────────────────────────────────────
  describe('list', () => {
    it('calls repository with correct pagination params', async () => {
      const mockResult = { items: [baseUser], total: 1 };
      mockRepo.list.mockResolvedValue(mockResult);

      const result = await usersService.list({
        page: 2,
        limit: 10,
        sortBy: 'name',
        order: 'asc',
      });

      expect(mockRepo.list).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        search: undefined,
        sortBy: 'name',
        order: 'asc',
      });
      expect(result).toEqual(mockResult);
    });

    it('passes search param to repository', async () => {
      mockRepo.list.mockResolvedValue({ items: [], total: 0 });
      await usersService.list({ page: 1, limit: 20, search: 'silva', sortBy: 'createdAt', order: 'desc' });
      expect(mockRepo.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'silva' }));
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      name: 'Ana Lima',
      email: 'ana@email.com',
      password: 'SecurePass1',
    };

    it('creates user successfully when email is unique', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed_new' as never);
      mockRepo.create.mockResolvedValue({ ...baseUser, email: dto.email, name: dto.name });

      const result = await usersService.create(dto);

      expect(mockRepo.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockHash).toHaveBeenCalledWith(dto.password, 12);
      expect(mockRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        passwordHash: 'hashed_new',
        phone: undefined,
      });
      expect(result).toBeDefined();
    });

    it('throws ConflictError when email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      await expect(usersService.create(dto)).rejects.toThrow(ConflictError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('passes phone when provided', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed' as never);
      mockRepo.create.mockResolvedValue(baseUser);

      await usersService.create({ ...dto, phone: '11999999999' });
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ phone: '11999999999' }));
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('updates user when found', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      const updated = { ...baseUser, name: 'Maria Souza' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await usersService.update('user-uuid-1', { name: 'Maria Souza' });

      expect(mockRepo.findById).toHaveBeenCalledWith('user-uuid-1');
      expect(mockRepo.update).toHaveBeenCalledWith('user-uuid-1', { name: 'Maria Souza' });
      expect(result.name).toBe('Maria Souza');
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(usersService.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
    });
  });

  // ── changePassword ───────────────────────────────────────────────────────────
  describe('changePassword', () => {
    const dto = { currentPassword: 'OldPass1', newPassword: 'NewPass2' };

    it('changes password successfully', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      mockCompare.mockResolvedValue(true as never);
      mockHash.mockResolvedValue('new_hash' as never);
      mockRepo.updatePassword.mockResolvedValue({ id: baseUser.id });

      await usersService.changePassword('user-uuid-1', dto);

      expect(mockCompare).toHaveBeenCalledWith(dto.currentPassword, 'hashed_password');
      expect(mockHash).toHaveBeenCalledWith(dto.newPassword, 12);
      expect(mockRepo.updatePassword).toHaveBeenCalledWith('user-uuid-1', 'new_hash');
    });

    it('throws ValidationError when user has no password', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      mockRepo.findByEmail.mockResolvedValue({ ...userWithPassword, passwordHash: null });

      await expect(usersService.changePassword('user-uuid-1', dto)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when user not found by email', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      mockRepo.findByEmail.mockResolvedValue(null);

      await expect(usersService.changePassword('user-uuid-1', dto)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when current password is wrong', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      mockCompare.mockResolvedValue(false as never);

      await expect(usersService.changePassword('user-uuid-1', dto)).rejects.toThrow(ValidationError);
      expect(mockRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when user id not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(usersService.changePassword('bad-id', dto)).rejects.toThrow(NotFoundError);
    });
  });

  // ── softDelete ───────────────────────────────────────────────────────────────
  describe('softDelete', () => {
    it('soft-deletes user when found', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      mockRepo.softDelete.mockResolvedValue({ id: baseUser.id });

      await usersService.softDelete('user-uuid-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('user-uuid-1');
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(usersService.softDelete('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ── verifyPassword ───────────────────────────────────────────────────────────
  describe('verifyPassword', () => {
    it('returns safe user when credentials are valid', async () => {
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      mockCompare.mockResolvedValue(true as never);

      const result = await usersService.verifyPassword('maria@email.com', 'correct_pass');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('returns null when user not found', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      const result = await usersService.verifyPassword('unknown@email.com', 'pass');
      expect(result).toBeNull();
    });

    it('returns null when user has no passwordHash', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...userWithPassword, passwordHash: null });
      const result = await usersService.verifyPassword('maria@email.com', 'pass');
      expect(result).toBeNull();
    });

    it('returns null when password is wrong', async () => {
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      mockCompare.mockResolvedValue(false as never);
      const result = await usersService.verifyPassword('maria@email.com', 'wrong_pass');
      expect(result).toBeNull();
    });
  });

  // ── forgotPassword ───────────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    const fakeTokenBuffer = { toString: () => 'fake_hex_token_32bytes' } as Buffer;
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    afterEach(() => {
      if (originalAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      }
    });

    it('sets reset token and sends email when user exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      mockRandomBytes.mockReturnValue(fakeTokenBuffer as any);
      mockRepo.setPasswordResetToken.mockResolvedValue({ id: baseUser.id } as any);
      mockSendEmail.mockResolvedValue(undefined as any);

      await usersService.forgotPassword('maria@email.com');

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('maria@email.com');
      expect(mockRepo.setPasswordResetToken).toHaveBeenCalledWith(
        baseUser.id,
        'fake_hex_token_32bytes',
        expect.any(Date),
      );
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'maria@email.com' }),
      );
    });

    it('returns silently when email does not exist (anti-enumeration)', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);

      await usersService.forgotPassword('nobody@email.com');

      expect(mockRepo.setPasswordResetToken).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('uses fallback greeting when user name is null', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...userWithPassword, name: null } as any);
      mockRandomBytes.mockReturnValue(fakeTokenBuffer as any);
      mockRepo.setPasswordResetToken.mockResolvedValue({ id: baseUser.id } as any);
      mockSendEmail.mockResolvedValue(undefined as any);

      await usersService.forgotPassword('maria@email.com');

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('Hi there,') }),
      );
    });

    it('uses NEXT_PUBLIC_APP_URL when it is configured', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://custom.corepilates.com';
      mockRepo.findByEmail.mockResolvedValue(userWithPassword);
      mockRandomBytes.mockReturnValue(fakeTokenBuffer as any);
      mockRepo.setPasswordResetToken.mockResolvedValue({ id: baseUser.id } as any);
      mockSendEmail.mockResolvedValue(undefined as any);

      await usersService.forgotPassword('maria@email.com');

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://custom.corepilates.com/reset-password?token='),
        }),
      );
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      mockRepo.findByPasswordResetToken.mockResolvedValue({
        id: baseUser.id,
        email: baseUser.email,
        name: baseUser.name,
      });
      mockHash.mockResolvedValue('new_hash' as never);
      mockRepo.updatePassword.mockResolvedValue({ id: baseUser.id });
      mockRepo.clearPasswordResetToken.mockResolvedValue({ id: baseUser.id });

      await usersService.resetPassword('valid_token', 'NewPass1!');

      expect(mockRepo.findByPasswordResetToken).toHaveBeenCalledWith('valid_token');
      expect(mockHash).toHaveBeenCalledWith('NewPass1!', 12);
      expect(mockRepo.updatePassword).toHaveBeenCalledWith(baseUser.id, 'new_hash');
      expect(mockRepo.clearPasswordResetToken).toHaveBeenCalledWith(baseUser.id);
    });

    it('throws ValidationError when token is invalid or expired', async () => {
      mockRepo.findByPasswordResetToken.mockResolvedValue(null);

      await expect(usersService.resetPassword('bad_token', 'NewPass1!')).rejects.toThrow(
        ValidationError,
      );
      expect(mockRepo.updatePassword).not.toHaveBeenCalled();
    });
  });

  // ── updateRole ────────────────────────────────────────────────────────────────
  describe('updateRole', () => {
    it('updates role when user exists', async () => {
      mockRepo.findById.mockResolvedValue(baseUser);
      mockRepo.updateRole.mockResolvedValue({
        id: baseUser.id,
        name: baseUser.name,
        email: baseUser.email,
        role: 'ADMIN',
      } as any);

      const result = await usersService.updateRole('user-uuid-1', 'ADMIN');

      expect(mockRepo.updateRole).toHaveBeenCalledWith('user-uuid-1', 'ADMIN');
      expect(result).toMatchObject({ role: 'ADMIN' });
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(usersService.updateRole('bad-id', 'CLIENT')).rejects.toThrow(NotFoundError);
      expect(mockRepo.updateRole).not.toHaveBeenCalled();
    });
  });
});
