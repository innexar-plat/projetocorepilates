import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plansService } from '@/modules/plans/services/plans.service';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole, SubscriptionStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const manualSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/v1/admin/subscriptions/manual
 * Creates a subscription for a client with a cash/offline payment.
 * Admin only.
 *
 * Flow:
 *  1. Validates user + plan exist.
 *  2. Ensures the user has a Stripe customer (for future billing if needed).
 *  3. Creates a Payment record with status SUCCEEDED (manual confirmation).
 *  4. Creates a Subscription with ACTIVE status valid for 30 days.
 *  5. Returns created subscription.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const { userId, planId, notes } = manualSchema.parse(body);

    const plan = await plansService.getActiveById(planId);
    const user = await usersRepository.findById(userId);
    if (!user) return apiError(new Error('User not found'), 404);

    // Ensure user has Stripe customer for future use
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      try {
        const customer = await stripeCall('create customer', () =>
          stripe.customers.create({
            email: user.email,
            name: user.name ?? undefined,
            metadata: { userId: user.id },
          }),
        );
        stripeCustomerId = customer.id;
        await usersRepository.updateStripeCustomerId(user.id, stripeCustomerId);
      } catch (e) {
        logger.warn({ userId, err: e }, 'Could not create Stripe customer for manual subscription');
      }
    }

    // Unique manual ID to satisfy DB unique constraint
    const manualSubId = `manual_${Date.now()}_${userId.slice(0, 8)}`;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Create payment record (manual confirmation)
    await db.payment.create({
      data: {
        userId,
        amount: plan.price,
        currency: 'usd',
        status: PaymentStatus.SUCCEEDED,
        description: `Manual payment — ${plan.name}${notes ? ` — ${notes}` : ''}`,
      },
    });

    // Upsert subscription
    const subscription = await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        stripeSubscriptionId: manualSubId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        classesUsedThisMonth: 0,
      },
      update: {
        planId,
        stripeSubscriptionId: manualSubId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        classesUsedThisMonth: 0,
      },
      include: { plan: true },
    });

    logger.info({ adminId: session.user.id, userId, planId }, 'Manual subscription created');

    return apiSuccess({ data: subscription });
  } catch (err) {
    return apiError(err);
  }
}
