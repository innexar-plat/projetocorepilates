import { POST } from '../route';
import { stripe } from '@/lib/stripe';
import { paymentsService } from '@/modules/payments/services/payments.service';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';
import { db } from '@/lib/db';
import { clearIdempotencyStore } from '@/lib/idempotency';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
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

const stripeMock = jest.mocked(stripe);
const paymentsMock = jest.mocked(paymentsService);
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
});
