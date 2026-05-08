import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';
import { db } from '@/lib/db';
import { apiSuccess, apiError, apiClientError } from '@/lib/api';
import { z } from 'zod';
import { BookingStatus, ClassSessionStatus } from '@prisma/client';

const STRIPE_PRICE_ID_REGEX = /^price_[A-Za-z0-9]+$/;

const checkoutSchema = z.object({
  // Accept UUID and seeded string identifiers (e.g. seed-essential, seed-session-...)
  planId: z.string().trim().min(1).max(120),
  classSessionId: z.string().trim().min(1).max(160),
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
    const { planId, classSessionId, successUrl, cancelUrl } = checkoutSchema.parse(body);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let plan = await plansService.getActiveById(planId);
    if (!plan.stripePriceId || !STRIPE_PRICE_ID_REGEX.test(plan.stripePriceId)) {
      await plansService.syncActivePlansWithStripe();
      plan = await plansService.getActiveById(planId);

      if (!plan.stripePriceId || !STRIPE_PRICE_ID_REGEX.test(plan.stripePriceId)) {
        return apiClientError(
          503,
          'Service Unavailable',
          'Selected plan is not connected to a real Stripe price yet.',
        );
      }
    }

    const user = await usersRepository.findById(session.user.id);
    if (!user) return apiError(new Error('User not found'), 404);

    const classSession = await db.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        class: {
          select: {
            id: true,
            maxCapacity: true,
            isActive: true,
          },
        },
      },
    });

    if (!classSession || !classSession.class?.isActive || classSession.status !== ClassSessionStatus.SCHEDULED || classSession.date < today) {
      return apiError(new Error('Selected class session is not available'), 400);
    }

    const confirmedBookings = await db.booking.count({
      where: {
        classSessionId,
        status: BookingStatus.CONFIRMED,
      },
    });

    if (confirmedBookings >= classSession.class.maxCapacity) {
      return apiError(new Error('Selected class session is full'), 409);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://braziliancorepilates.com';

    const stripeSecret = process.env.STRIPE_SECRET_KEY ?? '';
    if (!stripeSecret || stripeSecret.includes('placeholder') || !stripeSecret.startsWith('sk_')) {
      return apiClientError(
        503,
        'Service Unavailable',
        'Stripe is not configured. Set STRIPE_SECRET_KEY with a valid key.',
      );
    }

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
        success_url: successUrl ?? `${appUrl}/checkout/processando?checkout=success`,
        cancel_url: cancelUrl ?? `${appUrl}/planos`,
        client_reference_id: session.user.id,
        metadata: { userId: session.user.id, planId, classSessionId },
        subscription_data: {
          metadata: { userId: session.user.id, planId, classSessionId },
        },
        allow_promotion_codes: true,
      }),
    );

    return apiSuccess({ data: { url: checkoutSession.url, sessionId: checkoutSession.id } });
  } catch (err) {
    return apiError(err);
  }
}
