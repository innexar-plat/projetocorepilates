import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';
import { apiSuccess, apiError } from '@/lib/api';

/**
 * POST /api/v1/subscriptions/portal
 * Creates a Stripe Billing Portal session for the authenticated user.
 *
 * Allows users to:
 *  - View invoice history
 *  - Update payment method
 *  - Cancel or change their subscription
 *
 * Requires the user to already have a Stripe customer ID (i.e., has subscribed before).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const user = await usersRepository.findById(session.user.id);
    if (!user?.stripeCustomerId) {
      return apiError(new Error('No active billing account found'), 422);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://braziliancorepilates.com';
    const returnUrl = `${appUrl}/portal`;

    const portalSession = await stripeCall('create billing portal session', () =>
      stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId!,
        return_url: returnUrl,
      }),
    );

    return apiSuccess({ data: { url: portalSession.url } });
  } catch (err) {
    return apiError(err);
  }
}
