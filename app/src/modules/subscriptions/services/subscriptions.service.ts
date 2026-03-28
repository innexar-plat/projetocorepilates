import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { SubscriptionStatus } from '@prisma/client';

export const subscriptionsService = {
  async getByUserId(userId: string) {
    const sub = await db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundError('Subscription not found');
    return sub;
  },

  async getActiveByUserId(userId: string) {
    const sub = await db.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundError('No active subscription found');
    return sub;
  },

  // Called by Stripe webhook: customer.subscription.created / updated
  async upsertFromStripe(data: {
    userId: string;
    planId: string;
    stripeSubscriptionId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  }) {
    return db.subscription.upsert({
      where: { userId: data.userId },
      create: { ...data, classesUsedThisMonth: 0 },
      update: {
        planId: data.planId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      },
    });
  },

  // Called by Stripe webhook: invoice.paid — reset monthly class counter
  async resetMonthlyClassCount(stripeSubscriptionId: string) {
    const sub = await db.subscription.findUnique({ where: { stripeSubscriptionId } });
    if (!sub) throw new NotFoundError('Subscription not found for stripe id');
    return db.subscription.update({
      where: { stripeSubscriptionId },
      data: { classesUsedThisMonth: 0 },
    });
  },

  // Called by Stripe webhook: customer.subscription.deleted
  async cancel(stripeSubscriptionId: string) {
    const sub = await db.subscription.findUnique({ where: { stripeSubscriptionId } });
    if (!sub) throw new NotFoundError('Subscription not found for stripe id');
    return db.subscription.update({
      where: { stripeSubscriptionId },
      data: { status: SubscriptionStatus.CANCELED },
    });
  },
};
