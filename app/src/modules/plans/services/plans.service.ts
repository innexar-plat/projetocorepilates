import { plansRepository } from '../repositories/plans.repository';
import { NotFoundError } from '@/lib/errors';
import type { CreatePlanDto, UpdatePlanDto } from '../dtos/plan.dto';

const STRIPE_PRODUCT_ID_PATTERN = /^prod_[A-Za-z0-9]+$/;
const STRIPE_PRICE_ID_PATTERN = /^price_[A-Za-z0-9]+$/;

type StripeSyncStatus = 'reused' | 'synced';

type StripeSyncedPlan = {
  planId: string;
  name: string;
  status: StripeSyncStatus;
  stripeProductId: string;
  stripePriceId: string;
};

type StripeSyncResult = {
  totalActivePlans: number;
  reusedCount: number;
  syncedCount: number;
  plans: StripeSyncedPlan[];
};

function isValidStripeProductId(value: string | null | undefined): value is string {
  return Boolean(value && STRIPE_PRODUCT_ID_PATTERN.test(value));
}

function isValidStripePriceId(value: string | null | undefined): value is string {
  return Boolean(value && STRIPE_PRICE_ID_PATTERN.test(value));
}

function toStripeUnitAmount(price: unknown): number {
  const numericValue = Number(price);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error('Invalid plan price to create Stripe price');
  }
  return Math.round(numericValue * 100);
}

function normalizeStripeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveBillingPrice(input: {
  price: number;
  isPromotion?: boolean;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
}) {
  if (input.isPromotion && typeof input.promotionalPrice === 'number' && input.promotionalPrice > 0) {
    return input.promotionalPrice;
  }

  return input.price;
}

async function syncPlanWithStripe(
  plan: Awaited<ReturnType<typeof plansRepository.findById>>,
  options?: { forceNewPrice?: boolean },
) {
  if (!plan) throw new NotFoundError('Plan not found');

  const { stripe, stripeCall } = await import('@/lib/stripe');
  const currency = (process.env.STRIPE_DEFAULT_CURRENCY ?? 'usd').toLowerCase();

  let stripeProductId = isValidStripeProductId(plan.stripeProductId)
    ? plan.stripeProductId
    : undefined;
  let stripePriceId =
    !options?.forceNewPrice && isValidStripePriceId(plan.stripePriceId)
      ? plan.stripePriceId
      : undefined;

  const shouldCreateProduct = !stripeProductId;
  const shouldCreatePrice = !stripePriceId;

  const existingStripePriceId = stripePriceId;
  if (!stripeProductId && existingStripePriceId) {
    const stripePrice = await stripeCall(
      `retrieve stripe price for plan ${plan.id}`,
      () => stripe.prices.retrieve(existingStripePriceId),
    );
    stripeProductId =
      typeof stripePrice.product === 'string'
        ? stripePrice.product
        : stripePrice.product.id;
  }

  if (!stripeProductId) {
    const createdProduct = await stripeCall(
      `create stripe product for plan ${plan.id}`,
      () =>
        stripe.products.create({
          name: plan.name,
          description: plan.description ?? undefined,
          metadata: {
            planId: plan.id,
            classesPerMonth: String(plan.classesPerMonth),
          },
        }),
    );
    stripeProductId = createdProduct.id;
  }

  if (!stripePriceId) {
    const createdPrice = await stripeCall(
      `create stripe recurring price for plan ${plan.id}`,
      () =>
        stripe.prices.create({
          product: stripeProductId,
          unit_amount: toStripeUnitAmount(plan.price),
          currency,
          recurring: { interval: 'month' },
          metadata: {
            planId: plan.id,
          },
        }),
    );
    stripePriceId = createdPrice.id;
  }

  if (shouldCreateProduct || shouldCreatePrice || options?.forceNewPrice) {
    await plansRepository.update(plan.id, {
      stripeProductId,
      stripePriceId,
    });
  }

  return {
    planId: plan.id,
    name: plan.name,
    status: shouldCreateProduct || shouldCreatePrice || options?.forceNewPrice ? 'synced' : 'reused',
    stripeProductId,
    stripePriceId,
  } as StripeSyncedPlan;
}

export const plansService = {
  listAll(onlyActive = false) {
    return plansRepository.findAll(onlyActive);
  },

  async getById(id: string) {
    const plan = await plansRepository.findById(id);
    if (!plan) throw new NotFoundError('Plan not found');
    return plan;
  },

  async getActiveById(id: string) {
    const plan = await plansService.getById(id);
    if (!plan.isActive) throw new NotFoundError('Plan not found or inactive');
    return plan;
  },

  async create(dto: CreatePlanDto) {
    const normalizedStripePriceId = normalizeStripeId(dto.stripePriceId);
    const normalizedStripeProductId = normalizeStripeId(dto.stripeProductId);
    const {
      stripePriceId: _rawStripePriceId,
      stripeProductId: _rawStripeProductId,
      ...dtoWithoutStripeIds
    } = dto;

    const isPromotion = dto.isPromotion === true;
    const originalPrice = isPromotion ? dto.originalPrice ?? dto.price : undefined;
    const promotionalPrice = isPromotion ? dto.promotionalPrice ?? dto.price : undefined;
    const billingPrice = resolveBillingPrice({
      price: dto.price,
      isPromotion,
      originalPrice,
      promotionalPrice,
    });

    const createPayload: CreatePlanDto = {
      ...dtoWithoutStripeIds,
      price: billingPrice,
      ...(isPromotion
        ? {
            isPromotion: true,
            originalPrice,
            promotionalPrice,
          }
        : {}),
      ...(normalizedStripePriceId ? { stripePriceId: normalizedStripePriceId } : {}),
      ...(normalizedStripeProductId ? { stripeProductId: normalizedStripeProductId } : {}),
    };

    const created = await plansRepository.create(createPayload);

    if (created.isActive) {
      const synced = await syncPlanWithStripe(created);
      if (synced.status === 'synced') {
        return plansService.getById(created.id);
      }
    }

    return created;
  },

  async update(id: string, dto: UpdatePlanDto) {
    const existing = await plansService.getById(id); // ensure exists

    const updatePayload: UpdatePlanDto = { ...dto };

    const hasPromotionInput =
      dto.isPromotion !== undefined ||
      dto.originalPrice !== undefined ||
      dto.promotionalPrice !== undefined ||
      dto.price !== undefined;

    let nextBillingPrice = existing.price;
    if (hasPromotionInput) {
      const nextIsPromotion = dto.isPromotion ?? existing.isPromotion;
      const nextOriginalPrice = dto.originalPrice ?? existing.originalPrice ?? existing.price;
      const nextPromotionalPrice = nextIsPromotion
        ? (dto.promotionalPrice ?? existing.promotionalPrice ?? existing.price)
        : undefined;

      const explicitPrice = typeof dto.price === 'number' ? dto.price : existing.price;
      nextBillingPrice = resolveBillingPrice({
        price: explicitPrice,
        isPromotion: nextIsPromotion,
        originalPrice: nextOriginalPrice,
        promotionalPrice: nextPromotionalPrice,
      });

      if (dto.isPromotion !== undefined) {
        updatePayload.isPromotion = nextIsPromotion;
      }

      if (nextIsPromotion) {
        updatePayload.originalPrice = nextOriginalPrice;
        updatePayload.promotionalPrice = nextPromotionalPrice;
      } else if (dto.isPromotion === false) {
        // Keep historical original/promotional values intact and only disable the flag.
        delete updatePayload.originalPrice;
        delete updatePayload.promotionalPrice;
      }

      updatePayload.price = nextBillingPrice;
    }

    const normalizedStripePriceId =
      dto.stripePriceId !== undefined
        ? normalizeStripeId(dto.stripePriceId)
        : undefined;
    const normalizedStripeProductId =
      dto.stripeProductId !== undefined
        ? normalizeStripeId(dto.stripeProductId)
        : undefined;

    const priceChanged = Number(existing.price) !== Number(nextBillingPrice);

    if (dto.stripePriceId !== undefined) {
      updatePayload.stripePriceId = normalizedStripePriceId ?? undefined;
    }
    if (dto.stripeProductId !== undefined) {
      updatePayload.stripeProductId = normalizedStripeProductId ?? undefined;
    }

    const updated = await plansRepository.update(id, updatePayload);

    if (updated.isActive) {
      const synced = await syncPlanWithStripe(updated, { forceNewPrice: priceChanged });
      if (synced.status === 'synced') {
        return plansService.getById(updated.id);
      }
    }

    return updated;
  },

  async deactivate(id: string) {
    await plansService.getById(id);
    return plansRepository.update(id, { isActive: false });
  },

  async syncActivePlansWithStripe(): Promise<StripeSyncResult> {
    const activePlans = await plansRepository.findAll(true);
    if (activePlans.length === 0) {
      return {
        totalActivePlans: 0,
        reusedCount: 0,
        syncedCount: 0,
        plans: [],
      };
    }

    const plans: StripeSyncedPlan[] = [];

    for (const plan of activePlans) {
      plans.push(await syncPlanWithStripe(plan));
    }

    const syncedCount = plans.filter((plan) => plan.status === 'synced').length;
    return {
      totalActivePlans: activePlans.length,
      reusedCount: activePlans.length - syncedCount,
      syncedCount,
      plans,
    };
  },
};
