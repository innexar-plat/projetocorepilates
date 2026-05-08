import { db } from '@/lib/db';
import type { UpsertSettingDto } from '../dtos/settings.dto';

export const settingsRepository = {
  findAll(group?: string) {
    return db.siteSetting.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  },

  findByKey(key: string) {
    return db.siteSetting.findUnique({ where: { key } });
  },

  async upsert({ key, value, group }: UpsertSettingDto) {
    return db.siteSetting.upsert({
      where: { key },
      update: { value, group },
      create: { key, value, group },
    });
  },

  async bulkUpsert(settings: UpsertSettingDto[]) {
    return db.$transaction(
      settings.map((s) =>
        db.siteSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, group: s.group },
          create: { key: s.key, value: s.value, group: s.group },
        }),
      ),
    );
  },

  delete(key: string) {
    return db.siteSetting.delete({ where: { key } });
  },
};
