import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive('Price must be greater than 0').multipleOf(0.01),
  classesPerMonth: z.number().int().min(1).max(999),
  stripePriceId: z.string().min(1, 'Stripe Price ID is required'),
  stripeProductId: z.string().min(1, 'Stripe Product ID is required'),
  order: z.number().int().min(0).default(0),
});

export type CreatePlanDto = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
