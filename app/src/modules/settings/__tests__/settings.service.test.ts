import { settingsService } from '../services/settings.service';
import { settingsRepository } from '../repositories/settings.repository';

jest.mock('../repositories/settings.repository');

const mockRepo = jest.mocked(settingsRepository);

const fakeSetting: any = {
  id: 'setting-uuid-1',
  key: 'site.name',
  value: 'Core Pilates',
  group: 'general',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('settingsService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getAll ────────────────────────────────────────────────────────────────────
  describe('getAll()', () => {
    it('returns all settings when no group is provided', async () => {
      mockRepo.findAll.mockResolvedValue([fakeSetting]);
      const result = await settingsService.getAll();
      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
    });

    it('passes group filter to repository', async () => {
      mockRepo.findAll.mockResolvedValue([fakeSetting]);
      await settingsService.getAll('general');
      expect(mockRepo.findAll).toHaveBeenCalledWith('general');
    });
  });

  // ── getByKey ──────────────────────────────────────────────────────────────────
  describe('getByKey()', () => {
    it('delegates to repository findByKey', async () => {
      mockRepo.findByKey.mockResolvedValue(fakeSetting);
      const result = await settingsService.getByKey('site.name');
      expect(mockRepo.findByKey).toHaveBeenCalledWith('site.name');
      expect(result).toEqual(fakeSetting);
    });

    it('returns null when key does not exist', async () => {
      mockRepo.findByKey.mockResolvedValue(null);
      const result = await settingsService.getByKey('missing.key');
      expect(result).toBeNull();
    });
  });

  // ── bulkUpsert ────────────────────────────────────────────────────────────────
  describe('bulkUpsert()', () => {
    it('calls repository bulkUpsert with the settings array', async () => {
      mockRepo.bulkUpsert.mockResolvedValue([fakeSetting]);
      const dto = {
        settings: [{ key: 'site.name', value: 'New Name', group: 'general' }],
      };
      await settingsService.bulkUpsert(dto);
      expect(mockRepo.bulkUpsert).toHaveBeenCalledWith(dto.settings);
    });
  });
});
