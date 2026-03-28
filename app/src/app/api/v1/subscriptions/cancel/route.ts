import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';
import { stripe, stripeCall } from '@/lib/stripe';
import { db } from '@/lib/db';
import { apiNoContent, apiError } from '@/lib/api';

/**
 * DELETE /api/v1/subscriptions/cancel
 * Cancels the authenticated user's active subscription at period end via Stripe API.
 *
 * The subscription remains active until the end of the billing period.
 * The Stripe webhook (customer.subscription.updated) will update the DB status.
 */
export async function DELETE(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    // Find the user's active subscription
    const sub = await subscriptionsService.getActiveByUserId(session.user.id);

    if (!sub.stripeSubscriptionId) {
      return apiError(new Error('No Stripe subscription ID found'), 400);
    }

    // Verify it belongs to this user
    const dbSub = await db.subscription.findFirst({
      where: { userId: session.user.id, stripeSubscriptionId: sub.stripeSubscriptionId },
    });
    if (!dbSub) return apiError(new Error('Subscription not found'), 404);

    // Cancel at period end via Stripe (graceful cancellation)
    await stripeCall('cancel-subscription', () =>
      stripe.subscriptions.update(sub.stripeSubscriptionId!, {
        cancel_at_period_end: true,
      }),
    );

    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
