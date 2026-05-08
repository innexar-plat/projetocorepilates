import { POST } from '../route';
import { stripe } from '@/lib/stripe';
import { paymentsService } from '@/modules/payments/services/payments.service';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';
import { bookingsService } from '@/modules/bookings/services/bookings.service';
import { db } from '@/lib/db';
import { clearIdempotencyStore } from '@/lib/idempotency';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}));

jest.mock('@/modules/payments/services/payments.service', () => ({
  paymentsService: {
    recordPayment: jest.fn(),
  },
}));

jest.mock('@/modules/subscriptions/services/subscriptions.service', () => ({
  subscriptionsService: {
    upsertFromStripe: jest.fn(),
    cancel: jest.fn(),
    resetMonthlyClassCount: jest.fn(),
  },
}));

jest.mock('@/modules/bookings/services/bookings.service', () => ({
  bookingsService: {
    book: jest.fn(),
  },
}));

const stripeMock = jest.mocked(stripe);
const paymentsMock = jest.mocked(paymentsService);
const bookingsMock = jest.mocked(bookingsService);
const dbMock = jest.mocked(db);

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    clearIdempotencyStore();
    jest.clearAllMocks();
  });

  it('returns 400 when signature is missing', async () => {
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ ok: true }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Missing signature');
  });

  it('ignores duplicate stripe event deliveries', async () => {
    dbMock.user.findFirst.mockResolvedValue({ id: 'user-1' } as never);

    stripeMock.webhooks.constructEvent = jest.fn().mockReturnValue({
      id: 'evt_duplicate',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_1',
          customer: 'cus_1',
          amount_paid: 2500,
          currency: 'usd',
          description: 'Pilates subscription',
        },
      },
    } as any);

    paymentsMock.recordPayment.mockResolvedValue({ id: 'pay-1' } as never);

    const req1 = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: '{}',
    });

    const req2 = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: '{}',
    });

    const first = await POST(req1 as any);
    const second = await POST(req2 as any);

    expect(first.status).toBe(200);
    expect(paymentsMock.recordPayment).toHaveBeenCalledTimes(1);

    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({ received: true, duplicate: true });
    expect(paymentsMock.recordPayment).toHaveBeenCalledTimes(1);
  });

  it('creates booking when subscription becomes active with classSession metadata', async () => {
    dbMock.user.findFirst.mockResolvedValue({ id: 'user-1' } as never);
    dbMock.plan.findFirst.mockResolvedValue({ id: 'plan-1' } as never);

    stripeMock.webhooks.constructEvent = jest.fn().mockReturnValue({
      id: 'evt_subscription_active',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          metadata: {
            classSessionId: 'session-1',
          },
          items: {
            data: [{ price: { id: 'price_1' } }],
          },
        },
      },
    } as any);

    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: '{}',
    });

    const response = await POST(req as any);

    expect(response.status).toBe(200);
    expect(subscriptionsService.upsertFromStripe).toHaveBeenCalled();
    expect(bookingsMock.book).toHaveBeenCalledWith({ userId: 'user-1', classSessionId: 'session-1' });
  });

  it('syncs subscription and payment on checkout.session.completed when paid', async () => {
    dbMock.plan.findFirst.mockResolvedValue({ id: 'plan-1' } as never);

    stripeMock.webhooks.constructEvent = jest.fn().mockReturnValue({
      id: 'evt_checkout_completed',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          mode: 'subscription',
          customer: 'cus_1',
          client_reference_id: 'user-1',
          payment_status: 'paid',
          amount_total: 24900,
          currency: 'usd',
          invoice: 'in_1',
          payment_intent: 'pi_1',
          subscription: 'sub_1',
          metadata: {
            planId: 'plan-1',
            classSessionId: 'session-1',
          },
        },
      },
    } as any);

    stripeMock.subscriptions.retrieve = jest.fn().mockResolvedValue({
      id: 'sub_1',
      status: 'active',
      cancel_at_period_end: false,
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      metadata: {
        classSessionId: 'session-1',
      },
      items: {
        data: [{ price: { id: 'price_1' } }],
      },
    } as any);

    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: '{}',
    });

    const response = await POST(req as any);

    expect(response.status).toBe(200);
    expect(dbMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { stripeCustomerId: 'cus_1' },
    });
    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith('sub_1');
    expect(subscriptionsService.upsertFromStripe).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        planId: 'plan-1',
        stripeSubscriptionId: 'sub_1',
        status: 'ACTIVE',
      }),
    );
    expect(paymentsMock.recordPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        amount: 249,
        status: 'SUCCEEDED',
        stripeInvoiceId: 'in_1',
        stripePaymentIntentId: 'pi_1',
      }),
    );
    expect(bookingsMock.book).toHaveBeenCalledWith({ userId: 'user-1', classSessionId: 'session-1' });
  });

  it('uses subscription item period fields when top-level period is missing', async () => {
    dbMock.user.findFirst.mockResolvedValue({ id: 'user-1' } as never);
    dbMock.plan.findFirst.mockResolvedValue({ id: 'plan-1' } as never);

    stripeMock.webhooks.constructEvent = jest.fn().mockReturnValue({
      id: 'evt_subscription_item_period',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_2',
          customer: 'cus_1',
          status: 'active',
          cancel_at_period_end: false,
          items: {
            data: [
              {
                price: { id: 'price_1' },
                current_period_start: 1775393408,
                current_period_end: 1777985408,
              },
            ],
          },
        },
      },
    } as any);

    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: '{}',
    });

    const response = await POST(req as any);

    expect(response.status).toBe(200);
    expect(subscriptionsService.upsertFromStripe).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        planId: 'plan-1',
        stripeSubscriptionId: 'sub_2',
      }),
    );
    const callArgs = (subscriptionsService.upsertFromStripe as jest.Mock).mock.calls[0][0];
    expect(callArgs.currentPeriodStart).toBeInstanceOf(Date);
    expect(callArgs.currentPeriodEnd).toBeInstanceOf(Date);
    expect(Number.isNaN(callArgs.currentPeriodStart.getTime())).toBe(false);
    expect(Number.isNaN(callArgs.currentPeriodEnd.getTime())).toBe(false);
  });
});
