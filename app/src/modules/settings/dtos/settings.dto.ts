import { z } from 'zod';

export const upsertSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  group: z.string().max(50).default('general'),
});

export const bulkUpsertSettingsSchema = z.object({
  settings: z.array(upsertSettingSchema).min(1),
});

export type UpsertSettingDto = z.infer<typeof upsertSettingSchema>;
export type BulkUpsertSettingsDto = z.infer<typeof bulkUpsertSettingsSchema>;
