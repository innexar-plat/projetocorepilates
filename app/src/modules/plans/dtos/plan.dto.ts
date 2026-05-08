import { z } from 'zod';

function validatePromotion(
  value: {
    isPromotion?: boolean;
    originalPrice?: number;
    promotionalPrice?: number;
  },
  ctx: z.RefinementCtx,
) {
  const hasPromotionFields =
    value.originalPrice !== undefined || value.promotionalPrice !== undefined;

  if (value.isPromotion === false && hasPromotionFields) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['isPromotion'],
      message: 'Promotion fields require isPromotion to be true',
    });
    return;
  }

  if (!value.isPromotion) return;

  if (typeof value.originalPrice !== 'number' || value.originalPrice <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['originalPrice'],
      message: 'Original price is required when promotion is enabled',
    });
  }

  if (typeof value.promotionalPrice !== 'number' || value.promotionalPrice <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['promotionalPrice'],
      message: 'Promotional price is required when promotion is enabled',
    });
  }

  if (
    typeof value.originalPrice === 'number' &&
    typeof value.promotionalPrice === 'number' &&
    value.promotionalPrice >= value.originalPrice
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['promotionalPrice'],
      message: 'Promotional price must be lower than original price',
    });
  }
}

export const createPlanSchema = z
  .object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    price: z.number().positive('Price must be greater than 0').multipleOf(0.01),
    isPromotion: z.boolean().default(false),
    originalPrice: z.number().positive('Original price must be greater than 0').multipleOf(0.01).optional(),
    promotionalPrice: z.number().positive('Promotional price must be greater than 0').multipleOf(0.01).optional(),
    classesPerMonth: z.number().int().min(1).max(999),
    stripePriceId: z.string().min(1).optional(),
    stripeProductId: z.string().min(1).optional(),
    order: z.number().int().min(0).default(0),
  })
  .superRefine(validatePromotion);

export type CreatePlanDto = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    price: z.number().positive('Price must be greater than 0').multipleOf(0.01).optional(),
    isPromotion: z.boolean().optional(),
    originalPrice: z.number().positive('Original price must be greater than 0').multipleOf(0.01).optional(),
    promotionalPrice: z.number().positive('Promotional price must be greater than 0').multipleOf(0.01).optional(),
    classesPerMonth: z.number().int().min(1).max(999).optional(),
    stripePriceId: z.string().min(1).optional(),
    stripeProductId: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  })
  .superRefine(validatePromotion);

export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
