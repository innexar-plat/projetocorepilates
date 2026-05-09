import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';

const STRIPE_PRICE_ID_REGEX = /^price_[A-Za-z0-9]+$/;

const checkoutLinkSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
});

/**
 * POST /api/v1/admin/subscriptions/checkout-link
 * Generates a Stripe Checkout URL for a specific user + plan.
 * Admin can share this link with the client via email or WhatsApp.
 * Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const { userId, planId } = checkoutLinkSchema.parse(body);

    let plan = await plansService.getActiveById(planId);
    if (!plan.stripePriceId || !STRIPE_PRICE_ID_REGEX.test(plan.stripePriceId)) {
      await plansService.syncActivePlansWithStripe();
      plan = await plansService.getActiveById(planId);

      if (!plan.stripePriceId || !STRIPE_PRICE_ID_REGEX.test(plan.stripePriceId)) {
        return apiError(new Error('Selected plan is not connected to Stripe yet'), 503);
      }
    }
    const user = await usersRepository.findById(userId);
    if (!user) return apiError(new Error('User not found'), 404);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://braziliancorepilates.com';

    // Ensure Stripe customer exists
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeCall('create customer', () =>
        stripe.customers.create({
          email: user.email,
          name: user.name ?? undefined,
          metadata: { userId: user.id },
        }),
      );
      stripeCustomerId = customer.id;
      await usersRepository.updateStripeCustomerId(user.id, stripeCustomerId);
    }

    if (!stripeCustomerId) {
      return apiError(new Error('Unable to resolve Stripe customer for checkout'), 500);
    }

    const customerId: string = stripeCustomerId;
    const priceId: string = plan.stripePriceId;

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/checkout/processando?checkout=success`,
      cancel_url: `${appUrl}/planos`,
      metadata: { userId, planId, adminInitiated: 'true' },
    };

    const checkoutSession = await stripeCall('create checkout session', () =>
      stripe.checkout.sessions.create(checkoutParams),
    );

    return apiSuccess({
      data: {
        url: checkoutSession.url,
        expiresAt: new Date((checkoutSession.expires_at ?? 0) * 1000).toISOString(),
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
