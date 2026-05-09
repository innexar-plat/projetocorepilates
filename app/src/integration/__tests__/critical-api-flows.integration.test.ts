import { POST as applyReferralPOST } from '@/app/api/v1/referrals/apply/route';
import { POST as checkoutPOST } from '@/app/api/v1/subscriptions/checkout/route';
import { DELETE as cancelSubscriptionDELETE } from '@/app/api/v1/subscriptions/cancel/route';
import { auth } from '@/lib/auth';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/resend';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'MOCKREFCODE1'),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkPublicRateLimit: jest.fn(),
}));

jest.mock('@/lib/resend', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      update: jest.fn(),
    },
  },
  stripeCall: jest.fn(async (_description: string, fn: () => Promise<unknown>) => fn()),
}));

const authMock = auth as jest.Mock;
const rateLimitMock = checkPublicRateLimit as jest.Mock;
const sendEmailMock = sendEmail as jest.Mock;
const stripeCustomerCreateMock = stripe.customers.create as jest.Mock;
const stripeCheckoutCreateMock = stripe.checkout.sessions.create as jest.Mock;
const stripeSubscriptionUpdateMock = stripe.subscriptions.update as jest.Mock;

describe('Critical API flows integration', () => {
  const originalStripeSecret = process.env.STRIPE_SECRET_KEY;

  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
  });

  afterAll(() => {
    if (originalStripeSecret === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
      return;
    }
    process.env.STRIPE_SECRET_KEY = originalStripeSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimitMock.mockReturnValue(true);
    sendEmailMock.mockResolvedValue(undefined);
  });

  it('keeps public registration closed', async () => {
    const { POST: registerPOST } = await import('@/app/api/v1/auth/register/route');

    const req = new Request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ana Silva',
        email: 'ana@example.com',
        password: 'StrongPass1',
        referralCode: 'WELCOME10',
      }),
    });

    const res = await registerPOST(req as any);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Registration Closed');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('applies referral code for authenticated user through route + service + repository', async () => {
    authMock.mockResolvedValue({ user: { id: '44444444-4444-4444-8444-444444444444' } });

    (db.referral.findUnique as jest.Mock).mockResolvedValueOnce({
      id: '55555555-5555-4555-8555-555555555555',
      code: 'WELCOME10',
      referrerId: '66666666-6666-4666-8666-666666666666',
      referredId: null,
      status: 'PENDING',
      convertedAt: null,
    });
    (db.referral.update as jest.Mock).mockResolvedValueOnce({
      id: '55555555-5555-4555-8555-555555555555',
      code: 'WELCOME10',
      referrerId: '66666666-6666-4666-8666-666666666666',
      referredId: '44444444-4444-4444-8444-444444444444',
      status: 'CONVERTED',
      convertedAt: new Date('2026-03-28T00:02:00.000Z'),
    });

    const req = new Request('http://localhost/api/v1/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ code: 'welcome10' }),
    });

    const res = await applyReferralPOST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.data).toMatchObject({
      code: 'WELCOME10',
      status: 'CONVERTED',
    });
    expect(db.referral.findUnique).toHaveBeenCalledWith({ where: { code: 'WELCOME10' } });
  });

  it('creates checkout session for active plan using real plan and user repositories', async () => {
    const userId = '77777777-7777-4777-8777-777777777777';
    const planId = '88888888-8888-4888-8888-888888888888';
    const classSessionId = '99999999-9999-4999-8999-999999999999';

    authMock.mockResolvedValue({ user: { id: userId } });

    (db.plan.findUnique as jest.Mock).mockResolvedValueOnce({
      id: planId,
      name: 'Premium',
      description: 'Premium plan',
      price: '199.00',
      stripePriceId: 'price_123',
      stripeProductId: 'prod_123',
      classesPerMonth: 12,
      isActive: true,
      order: 1,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    });
    (db.user.findFirst as jest.Mock).mockResolvedValueOnce({
      id: userId,
      name: 'Ana Silva',
      email: 'ana@example.com',
      phone: null,
      role: 'CLIENT',
      avatarUrl: null,
      stripeCustomerId: null,
      isActive: true,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      deletedAt: null,
    });
    (db.user.update as jest.Mock).mockResolvedValueOnce({
      id: userId,
      name: 'Ana Silva',
      email: 'ana@example.com',
      phone: null,
      role: 'CLIENT',
      avatarUrl: null,
      stripeCustomerId: 'cus_123',
      isActive: true,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-28T00:00:00.000Z'),
      deletedAt: null,
    });
    (db.classSession.findUnique as jest.Mock).mockResolvedValueOnce({
      id: classSessionId,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      class: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        maxCapacity: 10,
        isActive: true,
      },
    });
    (db.booking.count as jest.Mock).mockResolvedValueOnce(1);

    stripeCustomerCreateMock.mockResolvedValue({ id: 'cus_123' });
    stripeCheckoutCreateMock.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId, classSessionId }),
    });

    const res = await checkoutPOST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.data).toEqual({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      sessionId: 'cs_test_123',
    });
    expect(stripeCustomerCreateMock).toHaveBeenCalled();
    expect(stripeCheckoutCreateMock).toHaveBeenCalled();
    expect(db.user.findFirst).toHaveBeenCalled();
  });

  it('cancels subscription at period end for authenticated user', async () => {
    const userId = '99999999-9999-4999-8999-999999999999';

    authMock.mockResolvedValue({ user: { id: userId } });

    (db.subscription.findFirst as jest.Mock)
      .mockResolvedValueOnce({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId,
        stripeSubscriptionId: 'sub_123',
        status: 'ACTIVE',
        plan: {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          classesPerMonth: 8,
        },
      })
      .mockResolvedValueOnce({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId,
        stripeSubscriptionId: 'sub_123',
      });

    stripeSubscriptionUpdateMock.mockResolvedValue({ id: 'sub_123' });

    const req = new Request('http://localhost/api/v1/subscriptions/cancel', {
      method: 'DELETE',
    });

    const res = await cancelSubscriptionDELETE(req as any);

    expect(res.status).toBe(204);
    expect(stripeSubscriptionUpdateMock).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: true,
    });
  });
});
