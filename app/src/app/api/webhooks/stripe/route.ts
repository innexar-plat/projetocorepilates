import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';
import { paymentsService } from '@/modules/payments/services/payments.service';
import { bookingsService } from '@/modules/bookings/services/bookings.service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiClientError, handleApiError } from '@/lib/api';
import { incrementMetric } from '@/lib/metrics';
import { registerIdempotencyKey } from '@/lib/idempotency';
import { ConflictError } from '@/lib/errors';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

const SUBSCRIPTION_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  trialing: SubscriptionStatus.ACTIVE,
  incomplete: SubscriptionStatus.PAST_DUE,
  incomplete_expired: SubscriptionStatus.CANCELED,
  unpaid: SubscriptionStatus.PAST_DUE,
};

function toSubscriptionStatus(status: string) {
  return SUBSCRIPTION_STATUS_MAP[status] ?? SubscriptionStatus.PAST_DUE;
}

function toValidDate(value: unknown): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      const unixDate = new Date(asNumber * 1000);
      if (!Number.isNaN(unixDate.getTime())) return unixDate;
    }

    const isoDate = new Date(value);
    return Number.isNaN(isoDate.getTime()) ? null : isoDate;
  }

  return null;
}

function getSubscriptionPeriodRange(sub: Stripe.Subscription) {
  const item = sub.items.data[0] as (Stripe.SubscriptionItem & { current_period_start?: unknown; current_period_end?: unknown }) | undefined;

  const start =
    toValidDate((sub as any).current_period_start) ??
    toValidDate(item?.current_period_start) ??
    toValidDate((sub as any).start_date) ??
    new Date();

  const end =
    toValidDate((sub as any).current_period_end) ??
    toValidDate(item?.current_period_end) ??
    toValidDate((sub as any).cancel_at) ??
    new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

  return { start, end };
}

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

async function tryCreateBookingFromMetadata(userId: string, classSessionId?: string | null) {
  if (!classSessionId) return;

  try {
    await bookingsService.book({ userId, classSessionId });
    logger.info({ userId, classSessionId }, '[Webhook] Booking created from Stripe metadata');
  } catch (err) {
    if (err instanceof ConflictError) {
      logger.info({ userId, classSessionId }, '[Webhook] Booking already exists for Stripe metadata');
      return;
    }

    logger.warn({ err, userId, classSessionId }, '[Webhook] Failed to create booking from Stripe metadata');
  }
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

      const period = getSubscriptionPeriodRange(sub);

      const normalizedStatus = toSubscriptionStatus(sub.status);

      await subscriptionsService.upsertFromStripe({
        userId,
        planId,
        stripeSubscriptionId: sub.id,
        status: normalizedStatus,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });

      const classSessionId = typeof sub.metadata?.classSessionId === 'string' ? sub.metadata.classSessionId : null;
      if (normalizedStatus === SubscriptionStatus.ACTIVE) {
        await tryCreateBookingFromMetadata(userId, classSessionId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      try {
        await subscriptionsService.cancel(sub.id);
      } catch (err) {
        logger.warn({ err, subscriptionId: sub.id }, '[Webhook] Failed to cancel subscription');
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await getCustomerUserId(invoice.customer as string);
      if (!userId) break;

      // Reset monthly class count on new billing cycle
      if ((invoice as any).subscription) {
        try {
          await subscriptionsService.resetMonthlyClassCount((invoice as any).subscription as string);
        } catch (err) {
          logger.warn(
            { err, subscriptionId: (invoice as any).subscription as string },
            '[Webhook] Failed to reset monthly class count',
          );
        }
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

      let userId: string | null = null;

      // Link Stripe customer to user if not already linked (via client_reference_id)
      const clientRef = checkoutSession.client_reference_id;
      if (clientRef) {
        userId = clientRef;
        try {
          await db.user.update({
            where: { id: clientRef },
            data: { stripeCustomerId: customerId },
          });
        } catch (err) {
          logger.warn({ err, userId: clientRef, customerId }, '[Webhook] Failed to link Stripe customer');
        }
      }

      if (!userId) {
        userId = await getCustomerUserId(customerId);
      }

      if (!userId) break;

      const subscriptionId =
        typeof checkoutSession.subscription === 'string'
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id;

      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price.id;
          const metadataPlanId =
            typeof checkoutSession.metadata?.planId === 'string' ? checkoutSession.metadata.planId : null;
          const planId = metadataPlanId ?? (priceId ? await getPlanIdByPriceId(priceId) : null);

          if (planId) {
            const normalizedStatus = toSubscriptionStatus(sub.status);
            const period = getSubscriptionPeriodRange(sub);

            await subscriptionsService.upsertFromStripe({
              userId,
              planId,
              stripeSubscriptionId: sub.id,
              status: normalizedStatus,
              currentPeriodStart: period.start,
              currentPeriodEnd: period.end,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            });

            if (normalizedStatus === SubscriptionStatus.ACTIVE) {
              const checkoutClassSessionId =
                typeof checkoutSession.metadata?.classSessionId === 'string'
                  ? checkoutSession.metadata.classSessionId
                  : null;
              const subscriptionClassSessionId =
                typeof sub.metadata?.classSessionId === 'string' ? sub.metadata.classSessionId : null;

              await tryCreateBookingFromMetadata(
                userId,
                checkoutClassSessionId ?? subscriptionClassSessionId,
              );
            }
          }
        } catch (err) {
          logger.warn({ err, sessionId: checkoutSession.id }, '[Webhook] Failed to sync subscription from checkout');
        }
      }

      const amountTotal = checkoutSession.amount_total ?? 0;
      if (checkoutSession.payment_status === 'paid' && amountTotal > 0) {
        try {
          await paymentsService.recordPayment({
            userId,
            amount: amountTotal / 100,
            currency: checkoutSession.currency ?? 'usd',
            status: PaymentStatus.SUCCEEDED,
            description: 'Stripe checkout payment',
            stripeInvoiceId: typeof checkoutSession.invoice === 'string' ? checkoutSession.invoice : undefined,
            stripePaymentIntentId:
              typeof checkoutSession.payment_intent === 'string'
                ? checkoutSession.payment_intent
                : undefined,
          });
        } catch (err) {
          logger.warn({ err, sessionId: checkoutSession.id }, '[Webhook] Failed to record checkout payment');
        }
      }

      logger.info(
        { sessionId: checkoutSession.id, customerId, clientRef, userId },
        '[Webhook] checkout.session.completed',
      );
      break;
    }
  }
}
