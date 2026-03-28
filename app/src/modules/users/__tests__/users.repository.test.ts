import { db } from '@/lib/db';
import { usersRepository } from '../repositories/users.repository';

const mockDb: any = db;

const baseUser: any = {
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

describe('usersRepository', () => {
  // ── findById ────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.user.findFirst with id and deletedAt filter', async () => {
      mockDb.user.findFirst.mockResolvedValue(baseUser);
      const result = await usersRepository.findById('user-uuid-1');
      expect(mockDb.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid-1', deletedAt: null } }),
      );
      expect(result).toEqual(baseUser);
    });
  });

  // ── findByEmail ─────────────────────────────────────────────────────────────
  describe('findByEmail', () => {
    it('calls db.user.findFirst with email and deletedAt filter', async () => {
      const userWithHash = { ...baseUser, passwordHash: 'hash' };
      mockDb.user.findFirst.mockResolvedValue(userWithHash);
      const result = await usersRepository.findByEmail('maria@email.com');
      expect(mockDb.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'maria@email.com', deletedAt: null } }),
      );
      expect(result).toEqual(userWithHash);
    });
  });

  // ── findByStripeCustomerId ──────────────────────────────────────────────────
  describe('findByStripeCustomerId', () => {
    it('calls db.user.findFirst with stripeCustomerId', async () => {
      mockDb.user.findFirst.mockResolvedValue(baseUser);
      const result = await usersRepository.findByStripeCustomerId('cus_123');
      expect(mockDb.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { stripeCustomerId: 'cus_123', deletedAt: null } }),
      );
      expect(result).toEqual(baseUser);
    });
  });

  // ── list ────────────────────────────────────────────────────────────────────
  describe('list', () => {
    it('paginates without search', async () => {
      mockDb.$transaction.mockImplementation((fns: any[]) => Promise.all(fns));
      mockDb.user.findMany.mockResolvedValue([baseUser]);
      mockDb.user.count.mockResolvedValue(1);

      const result = await usersRepository.list({ skip: 0, take: 20 });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      expect(result).toEqual({ items: [baseUser], total: 1 });
    });

    it('adds search OR clause when search param is provided', async () => {
      mockDb.$transaction.mockImplementation((fns: any[]) => Promise.all(fns));
      mockDb.user.findMany.mockResolvedValue([]);
      mockDb.user.count.mockResolvedValue(0);

      await usersRepository.list({ skip: 0, take: 20, search: 'maria' });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('uses sortBy and order params', async () => {
      mockDb.$transaction.mockImplementation((fns: any[]) => Promise.all(fns));
      mockDb.user.findMany.mockResolvedValue([]);
      mockDb.user.count.mockResolvedValue(0);

      await usersRepository.list({ skip: 0, take: 10, sortBy: 'name', order: 'asc' });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.user.create with provided data', async () => {
      mockDb.user.create.mockResolvedValue(baseUser);
      const data = { name: 'Ana', email: 'ana@email.com', passwordHash: 'hash' };
      const result = await usersRepository.create(data);
      expect(mockDb.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data }),
      );
      expect(result).toEqual(baseUser);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls db.user.update with id and data', async () => {
      const updated = { ...baseUser, name: 'New Name' };
      mockDb.user.update.mockResolvedValue(updated);
      const result = await usersRepository.update('user-uuid-1', { name: 'New Name' });
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid-1' }, data: { name: 'New Name' } }),
      );
      expect(result).toEqual(updated);
    });
  });

  // ── updatePassword ──────────────────────────────────────────────────────────
  describe('updatePassword', () => {
    it('calls db.user.update with passwordHash', async () => {
      mockDb.user.update.mockResolvedValue({ id: 'user-uuid-1' });
      await usersRepository.updatePassword('user-uuid-1', 'new_hash');
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { passwordHash: 'new_hash' },
        }),
      );
    });
  });

  // ── updateStripeCustomerId ──────────────────────────────────────────────────
  describe('updateStripeCustomerId', () => {
    it('calls db.user.update with stripeCustomerId', async () => {
      mockDb.user.update.mockResolvedValue(baseUser);
      await usersRepository.updateStripeCustomerId('user-uuid-1', 'cus_new');
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { stripeCustomerId: 'cus_new' },
        }),
      );
    });
  });

  // ── softDelete ──────────────────────────────────────────────────────────────
  describe('softDelete', () => {
    it('calls db.user.update with deletedAt and isActive false', async () => {
      mockDb.user.update.mockResolvedValue({ id: 'user-uuid-1' });
      await usersRepository.softDelete('user-uuid-1');
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  // ── setPasswordResetToken ───────────────────────────────────────────────────
  describe('setPasswordResetToken', () => {
    it('calls db.user.update with token and expiry', async () => {
      mockDb.user.update.mockResolvedValue({ id: 'user-uuid-1' });
      const expiry = new Date();
      await usersRepository.setPasswordResetToken('user-uuid-1', 'token_abc', expiry);
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { passwordResetToken: 'token_abc', passwordResetExpiry: expiry },
        }),
      );
    });
  });

  // ── findByPasswordResetToken ────────────────────────────────────────────────
  describe('findByPasswordResetToken', () => {
    it('calls db.user.findFirst with token and expiry filter', async () => {
      mockDb.user.findFirst.mockResolvedValue({ id: 'u', email: 'e@e.com', name: 'N' });
      const result = await usersRepository.findByPasswordResetToken('token_abc');
      expect(mockDb.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ passwordResetToken: 'token_abc' }),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── clearPasswordResetToken ─────────────────────────────────────────────────
  describe('clearPasswordResetToken', () => {
    it('clears token and expiry', async () => {
      mockDb.user.update.mockResolvedValue({ id: 'user-uuid-1' });
      await usersRepository.clearPasswordResetToken('user-uuid-1');
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { passwordResetToken: null, passwordResetExpiry: null },
        }),
      );
    });
  });

  // ── updateRole ──────────────────────────────────────────────────────────────
  describe('updateRole', () => {
    it('calls db.user.update with role', async () => {
      mockDb.user.update.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Maria',
        email: 'maria@email.com',
        role: 'ADMIN',
      });
      const result = await usersRepository.updateRole('user-uuid-1', 'ADMIN');
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { role: 'ADMIN' },
        }),
      );
      expect(result).toMatchObject({ role: 'ADMIN' });
    });
  });
});
