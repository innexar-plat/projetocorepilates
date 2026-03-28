import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * POST /api/v1/subscriptions/checkout
 * Creates a Stripe Checkout session for the authenticated user to subscribe to a plan.
 *
 * Flow:
 *  1. Validates the plan exists and is active.
 *  2. Gets or creates a Stripe customer for the user.
 *  3. Creates a Checkout session with subscription mode.
 *  4. Returns the checkout URL.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const { planId, successUrl, cancelUrl } = checkoutSchema.parse(body);

    const plan = await plansService.getActiveById(planId);
    const user = await usersRepository.findById(session.user.id);
    if (!user) return apiError(new Error('User not found'), 404);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://braziliancorepilates.com';

    // Ensure the user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeCall('create customer', () =>
        stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id },
        }),
      );
      stripeCustomerId = customer.id;
      await usersRepository.updateStripeCustomerId(user.id, stripeCustomerId);
    }

    const checkoutSession = await stripeCall('create checkout session', () =>
      stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId!,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: successUrl ?? `${appUrl}/portal?checkout=success`,
        cancel_url: cancelUrl ?? `${appUrl}/planos`,
        client_reference_id: session.user.id,
        metadata: { userId: session.user.id, planId },
        subscription_data: {
          metadata: { userId: session.user.id, planId },
        },
        allow_promotion_codes: true,
      }),
    );

    return apiSuccess({ data: { url: checkoutSession.url, sessionId: checkoutSession.id } });
  } catch (err) {
    return apiError(err);
  }
}
