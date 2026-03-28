import { db } from '@/lib/db';
import { clientProfilesRepository } from '../repositories/client-profiles.repository';

const mockDb = jest.mocked(db);

const baseProfile: any = {
  id: 'profile-uuid-1',
  userId: 'user-uuid-1',
  dateOfBirth: null,
  isComplete: false,
  completedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('clientProfilesRepository', () => {
  // ── findByUserId ─────────────────────────────────────────────────────────────
  describe('findByUserId', () => {
    it('calls db.clientProfile.findUnique with userId', async () => {
      mockDb.clientProfile.findUnique.mockResolvedValue(baseProfile);
      const result = await clientProfilesRepository.findByUserId('user-uuid-1');
      expect(mockDb.clientProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid-1' } }),
      );
      expect(result).toEqual(baseProfile);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.clientProfile.create with userId and profile data', async () => {
      mockDb.clientProfile.create.mockResolvedValue(baseProfile);
      const dto = { emergencyContact: 'Maria', emergencyPhone: '11999999999' };
      const result = await clientProfilesRepository.create('user-uuid-1', dto as any);
      expect(mockDb.clientProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-uuid-1' }),
        }),
      );
      expect(result).toEqual(baseProfile);
    });

    it('converts dateOfBirth string to Date when provided', async () => {
      mockDb.clientProfile.create.mockResolvedValue(baseProfile);
      await clientProfilesRepository.create('user-uuid-1', {
        dateOfBirth: '1990-05-15',
      } as any);
      expect(mockDb.clientProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dateOfBirth: new Date('1990-05-15') }),
        }),
      );
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls db.clientProfile.update with userId and partial data', async () => {
      const updated = { ...baseProfile, isComplete: true };
      mockDb.clientProfile.update.mockResolvedValue(updated);
      const result = await clientProfilesRepository.update('user-uuid-1', {
        emergencyContact: 'João',
      } as any);
      expect(mockDb.clientProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid-1' } }),
      );
      expect(result).toEqual(updated);
    });

    it('converts dateOfBirth string to Date when provided in update', async () => {
      mockDb.clientProfile.update.mockResolvedValue(baseProfile);
      await clientProfilesRepository.update('user-uuid-1', {
        dateOfBirth: '1990-05-15',
      } as any);
      expect(mockDb.clientProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dateOfBirth: new Date('1990-05-15') }),
        }),
      );
    });
  });

  // ── markComplete ──────────────────────────────────────────────────────────────
  describe('markComplete', () => {
    it('sets isComplete to true and stores completedAt', async () => {
      mockDb.clientProfile.update.mockResolvedValue({ ...baseProfile, isComplete: true });
      await clientProfilesRepository.markComplete('user-uuid-1');
      expect(mockDb.clientProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid-1' },
          data: expect.objectContaining({ isComplete: true, completedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // ── updateAssessment ──────────────────────────────────────────────────────────
  describe('updateAssessment', () => {
    it('calls db.clientProfile.update with assessment data and assessedByUserId', async () => {
      mockDb.clientProfile.update.mockResolvedValue(baseProfile);
      const dto = { weight: 60, height: 165 };
      await clientProfilesRepository.updateAssessment('user-uuid-1', dto as any, 'admin-uuid');
      expect(mockDb.clientProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid-1' },
          data: expect.objectContaining({ assessedByUserId: 'admin-uuid' }),
        }),
      );
    });
  });

  // ── listIncomplete ────────────────────────────────────────────────────────────
  describe('listIncomplete', () => {
    it('queries for incomplete profiles with default pagination', async () => {
      mockDb.clientProfile.findMany.mockResolvedValue([baseProfile]);
      const result = await clientProfilesRepository.listIncomplete();
      expect(mockDb.clientProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isComplete: false } }),
      );
      expect(result).toEqual([baseProfile]);
    });

    it('applies custom skip and take', async () => {
      mockDb.clientProfile.findMany.mockResolvedValue([]);
      await clientProfilesRepository.listIncomplete(10, 5);
      expect(mockDb.clientProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });
});
