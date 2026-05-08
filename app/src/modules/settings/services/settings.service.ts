import { settingsRepository } from '../repositories/settings.repository';
import type { BulkUpsertSettingsDto } from '../dtos/settings.dto';

export const settingsService = {
  getAll(group?: string) {
    return settingsRepository.findAll(group);
  },

  getByKey(key: string) {
    return settingsRepository.findByKey(key);
  },

  bulkUpsert(dto: BulkUpsertSettingsDto) {
    return settingsRepository.bulkUpsert(dto.settings);
  },
};
