import { subscriptionsService } from '../services/subscriptions.service';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { SubscriptionStatus } from '@prisma/client';

jest.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockDb = jest.mocked(db);

const fakePlan = { id: 'plan-id', name: 'Essential', classesPerMonth: 12 };
const fakeSubscription = {
  id: 'sub-id',
  userId: 'user-id',
  planId: 'plan-id',
  stripeSubscriptionId: 'sub_stripe_123',
  status: SubscriptionStatus.ACTIVE,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(),
  cancelAtPeriodEnd: false,
  classesUsedThisMonth: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  plan: fakePlan,
};

describe('subscriptionsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getByUserId()', () => {
    it('returns subscription with plan when found', async () => {
      mockDb.subscription.findUnique.mockResolvedValue(fakeSubscription as any);
      const result = await subscriptionsService.getByUserId('user-id');
      expect(result.plan.name).toBe('Essential');
    });

    it('throws NotFoundError when no subscription for user', async () => {
      mockDb.subscription.findUnique.mockResolvedValue(null);
      await expect(subscriptionsService.getByUserId('user-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActiveByUserId()', () => {
    it('returns active subscription when found', async () => {
      mockDb.subscription.findFirst.mockResolvedValue(fakeSubscription as any);
      const result = await subscriptionsService.getActiveByUserId('user-id');
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('throws NotFoundError when no active subscription', async () => {
      mockDb.subscription.findFirst.mockResolvedValue(null);
      await expect(subscriptionsService.getActiveByUserId('user-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('upsertFromStripe()', () => {
    it('upserts subscription data from Stripe webhook', async () => {
      mockDb.subscription.upsert.mockResolvedValue(fakeSubscription as any);
      const data = {
        userId: 'user-id',
        planId: 'plan-id',
        stripeSubscriptionId: 'sub_stripe_123',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      };
      const result = await subscriptionsService.upsertFromStripe(data);
      expect(mockDb.subscription.upsert).toHaveBeenCalled();
      expect(result).toEqual(fakeSubscription);
    });
  });

  describe('resetMonthlyClassCount()', () => {
    it('resets classesUsedThisMonth to 0 when subscription found', async () => {
      mockDb.subscription.findUnique.mockResolvedValue(fakeSubscription as any);
      mockDb.subscription.update.mockResolvedValue({ ...fakeSubscription, classesUsedThisMonth: 0 } as any);

      const result = await subscriptionsService.resetMonthlyClassCount('sub_stripe_123');
      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { classesUsedThisMonth: 0 } }),
      );
      expect(result.classesUsedThisMonth).toBe(0);
    });

    it('throws NotFoundError when stripe subscription id is not found', async () => {
      mockDb.subscription.findUnique.mockResolvedValue(null);
      await expect(subscriptionsService.resetMonthlyClassCount('invalid_id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('cancel()', () => {
    it('sets status to CANCELED when subscription found', async () => {
      mockDb.subscription.findUnique.mockResolvedValue(fakeSubscription as any);
      mockDb.subscription.update.mockResolvedValue({ ...fakeSubscription, status: SubscriptionStatus.CANCELED } as any);

      const result = await subscriptionsService.cancel('sub_stripe_123');
      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: SubscriptionStatus.CANCELED } }),
      );
      expect(result.status).toBe(SubscriptionStatus.CANCELED);
    });

    it('throws NotFoundError when stripe subscription id is not found', async () => {
      mockDb.subscription.findUnique.mockResolvedValue(null);
      await expect(subscriptionsService.cancel('invalid_id')).rejects.toThrow(NotFoundError);
    });
  });
});
