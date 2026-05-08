import { db } from '@/lib/db';
import { settingsRepository } from '../repositories/settings.repository';

const mockDb = jest.mocked(db);

const baseSetting: any = {
  id: 'setting-uuid-1',
  key: 'site.name',
  value: 'Core Pilates',
  group: 'general',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('settingsRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns all settings when no group filter', async () => {
      mockDb.siteSetting.findMany.mockResolvedValue([baseSetting]);
      const result = await settingsRepository.findAll();
      expect(mockDb.siteSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
      expect(result).toHaveLength(1);
    });

    it('filters by group when group is provided', async () => {
      mockDb.siteSetting.findMany.mockResolvedValue([baseSetting]);
      await settingsRepository.findAll('general');
      expect(mockDb.siteSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { group: 'general' } }),
      );
    });
  });

  // ── findByKey ────────────────────────────────────────────────────────────────
  describe('findByKey', () => {
    it('calls findUnique with key', async () => {
      mockDb.siteSetting.findUnique.mockResolvedValue(baseSetting);
      const result = await settingsRepository.findByKey('site.name');
      expect(mockDb.siteSetting.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'site.name' } }),
      );
      expect(result).toEqual(baseSetting);
    });

    it('returns null when key does not exist', async () => {
      mockDb.siteSetting.findUnique.mockResolvedValue(null);
      const result = await settingsRepository.findByKey('missing.key');
      expect(result).toBeNull();
    });
  });

  // ── upsert ───────────────────────────────────────────────────────────────────
  describe('upsert', () => {
    it('calls db.siteSetting.upsert with correct shape', async () => {
      mockDb.siteSetting.upsert.mockResolvedValue(baseSetting);
      const result = await settingsRepository.upsert({ key: 'site.name', value: 'Core Pilates', group: 'general' });
      expect(mockDb.siteSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'site.name' },
          update: expect.objectContaining({ value: 'Core Pilates' }),
          create: expect.objectContaining({ key: 'site.name', value: 'Core Pilates' }),
        }),
      );
      expect(result).toEqual(baseSetting);
    });
  });

  // ── bulkUpsert ────────────────────────────────────────────────────────────────
  describe('bulkUpsert', () => {
    it('wraps all upserts in a transaction', async () => {
      mockDb.siteSetting.upsert.mockResolvedValue(baseSetting);
      mockDb.$transaction.mockResolvedValue([baseSetting]);

      const settings = [
        { key: 'site.name', value: 'Core', group: 'general' },
        { key: 'site.phone', value: '123', group: 'contact' },
      ];
      await settingsRepository.bulkUpsert(settings);
      expect(mockDb.$transaction).toHaveBeenCalled();
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('deletes setting by key', async () => {
      mockDb.siteSetting.delete.mockResolvedValue(baseSetting);

      const result = await settingsRepository.delete('site.name');

      expect(mockDb.siteSetting.delete).toHaveBeenCalledWith({ where: { key: 'site.name' } });
      expect(result).toEqual(baseSetting);
    });
  });
});
