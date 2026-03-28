import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';
import { paymentsService } from '@/modules/payments/services/payments.service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiClientError, handleApiError } from '@/lib/api';
import { incrementMetric } from '@/lib/metrics';
import { registerIdempotencyKey } from '@/lib/idempotency';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  incrementMetric('webhook.stripe.requests.total');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    incrementMetric('webhook.stripe.requests.missing_signature');
    return apiClientError(400, 'Bad Request', 'Missing signature');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch {
    incrementMetric('webhook.stripe.requests.invalid_signature');
    return apiClientError(400, 'Bad Request', 'Invalid signature');
  }

  const isFirstDelivery = registerIdempotencyKey(`stripe:${event.id}`);
  if (!isFirstDelivery) {
    incrementMetric('webhook.stripe.requests.duplicate');
    logger.info({ eventId: event.id, type: event.type }, '[Webhook] Duplicate event ignored');
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event);
    incrementMetric('webhook.stripe.requests.success');
    return NextResponse.json({ received: true });
  } catch (err) {
    incrementMetric('webhook.stripe.requests.failed');
    logger.error({ err }, '[Webhook] Handler error');
    return handleApiError(err);
  }
}

async function getCustomerUserId(customerId: string): Promise<string | null> {
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function getPlanIdByPriceId(priceId: string): Promise<string | null> {
  const plan = await db.plan.findFirst({
    where: { stripePriceId: priceId },
    select: { id: true },
  });
  return plan?.id ?? null;
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await getCustomerUserId(sub.customer as string);
      if (!userId) break;

      const priceId = sub.items.data[0]?.price.id;
      const planId = priceId ? await getPlanIdByPriceId(priceId) : null;
      if (!planId) break;

      const statusMap: Record<string, SubscriptionStatus> = {
        active: SubscriptionStatus.ACTIVE,
        past_due: SubscriptionStatus.PAST_DUE,
        canceled: SubscriptionStatus.CANCELED,
        trialing: SubscriptionStatus.ACTIVE,
        incomplete: SubscriptionStatus.PAST_DUE,
        incomplete_expired: SubscriptionStatus.CANCELED,
        unpaid: SubscriptionStatus.PAST_DUE,
      };

      await subscriptionsService.upsertFromStripe({
        userId,
        planId,
        stripeSubscriptionId: sub.id,
        status: statusMap[sub.status] ?? SubscriptionStatus.PAST_DUE,
        currentPeriodStart: new Date((sub as any).current_period_start * 1000),
        currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await subscriptionsService.cancel(sub.id).catch((err) => {
        logger.warn({ err, subscriptionId: sub.id }, '[Webhook] Failed to cancel subscription');
        return null;
      });
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await getCustomerUserId(invoice.customer as string);
      if (!userId) break;

      // Reset monthly class count on new billing cycle
      if ((invoice as any).subscription) {
        await subscriptionsService
          .resetMonthlyClassCount((invoice as any).subscription as string)
          .catch((err) => {
            logger.warn(
              { err, subscriptionId: (invoice as any).subscription as string },
              '[Webhook] Failed to reset monthly class count',
            );
            return null;
          });
      }

      await paymentsService.recordPayment({
        userId,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: PaymentStatus.SUCCEEDED,
        description: invoice.description ?? 'Pilates subscription',
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: ((invoice as any).payment_intent as string) ?? undefined,
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await getCustomerUserId(invoice.customer as string);
      if (!userId) break;

      await paymentsService.recordPayment({
        userId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: PaymentStatus.FAILED,
        description: 'Payment failed',
        stripeInvoiceId: invoice.id,
      });
      break;
    }

    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode !== 'subscription') break;

      const customerId = checkoutSession.customer as string | null;
      if (!customerId) break;

      // Link Stripe customer to user if not already linked (via client_reference_id)
      const clientRef = checkoutSession.client_reference_id;
      if (clientRef) {
        await db.user
          .update({
            where: { id: clientRef },
            data: { stripeCustomerId: customerId },
          })
          .catch((err) => {
            logger.warn({ err, userId: clientRef, customerId }, '[Webhook] Failed to link Stripe customer');
            return null;
          });
      }

      logger.info(
        { sessionId: checkoutSession.id, customerId, clientRef },
        '[Webhook] checkout.session.completed',
      );
      break;
    }
  }
}
