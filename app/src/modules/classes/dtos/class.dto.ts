import { z } from 'zod';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

export const createClassSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  instructor: z.string().min(2).max(100),
  maxCapacity: z.number().int().min(1).max(100).default(10),
  durationMin: z.number().int().min(15).max(240).default(60),
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  isActive: z.boolean().default(true),
});

export const updateClassSchema = createClassSchema.partial();

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = z.infer<typeof updateClassSchema>;
