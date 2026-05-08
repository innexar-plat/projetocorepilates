import { z } from 'zod';

export const createBookingSchema = z.object({
  userId: z.string().uuid(),
  classSessionId: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9-]+$/, 'Invalid class session id format'),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;
