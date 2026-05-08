import { POST } from '../route';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';
import { db } from '@/lib/db';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/plans/services/plans.service', () => ({
  plansService: {
    getActiveById: jest.fn(),
    syncActivePlansWithStripe: jest.fn(),
  },
}));

jest.mock('@/modules/users/repositories/users.repository', () => ({
  usersRepository: {
    findById: jest.fn(),
    updateStripeCustomerId: jest.fn(),
  },
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
  },
  stripeCall: jest.fn((_: string, fn: () => Promise<unknown>) => fn()),
}));

jest.mock('@/lib/db', () => ({
  db: {
    classSession: { findUnique: jest.fn() },
    booking: { count: jest.fn() },
  },
}));

const authMock = auth as jest.Mock;
const getActiveByIdMock = plansService.getActiveById as jest.Mock;
const syncActivePlansWithStripeMock = plansService.syncActivePlansWithStripe as jest.Mock;
const findByIdMock = usersRepository.findById as jest.Mock;
const updateStripeCustomerIdMock = usersRepository.updateStripeCustomerId as jest.Mock;
const stripeCallMock = stripeCall as jest.Mock;
const dbMock = db as jest.Mocked<typeof db>;

describe('POST /api/v1/subscriptions/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_valid_key';

    dbMock.classSession.findUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      date: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      class: {
        id: 'class-1111-4111-8111-111111111111',
        maxCapacity: 12,
        isActive: true,
      },
    } as any);
    dbMock.booking.count.mockResolvedValue(4 as never);
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        classSessionId: '22222222-2222-4222-8222-222222222222',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid payload', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId: 'seed-essential' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
  });

  it('returns 404 when authenticated user does not exist in repository', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByIdMock.mockResolvedValue({
      id: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
      stripePriceId: 'price_123',
      isActive: true,
    });
    findByIdMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        classSessionId: '22222222-2222-4222-8222-222222222222',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
  });

  it('auto-syncs plans when stripe price id is invalid and proceeds to checkout', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByIdMock
      .mockResolvedValueOnce({
        id: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        stripePriceId: 'price_placeholder_ph',
        isActive: true,
      })
      .mockResolvedValueOnce({
        id: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        stripePriceId: 'price_123real',
        isActive: true,
      });
    syncActivePlansWithStripeMock.mockResolvedValue({ syncedCount: 1 });
    findByIdMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ana@email.com',
      name: 'Ana',
      stripeCustomerId: 'cus_existing',
    });
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      id: 'cs_test_synced',
      url: 'https://checkout.stripe.test/session/cs_test_synced',
    });

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        classSessionId: '22222222-2222-4222-8222-222222222222',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(syncActivePlansWithStripeMock).toHaveBeenCalledTimes(1);
    expect(getActiveByIdMock).toHaveBeenCalledTimes(2);
    expect(body.data.data.sessionId).toBe('cs_test_synced');
  });

  it('returns 409 when selected class session is full', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByIdMock.mockResolvedValue({
      id: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
      stripePriceId: 'price_123',
      isActive: true,
    });
    findByIdMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ana@email.com',
      name: 'Ana',
      stripeCustomerId: 'cus_existing',
    });
    dbMock.booking.count.mockResolvedValue(12 as never);

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        classSessionId: '22222222-2222-4222-8222-222222222222',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('Conflict');
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('returns 400 when selected class session is not available', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByIdMock.mockResolvedValue({
      id: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
      stripePriceId: 'price_123',
      isActive: true,
    });
    findByIdMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ana@email.com',
      name: 'Ana',
      stripeCustomerId: 'cus_existing',
    });
    dbMock.classSession.findUnique.mockResolvedValue(null as never);

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        classSessionId: '22222222-2222-4222-8222-222222222222',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('creates customer when needed and returns checkout url', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByIdMock.mockResolvedValue({
      id: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
      stripePriceId: 'price_123',
      isActive: true,
    });
    findByIdMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ana@email.com',
      name: 'Ana',
      stripeCustomerId: null,
    });
    (stripe.customers.create as jest.Mock).mockResolvedValue({ id: 'cus_123' });
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session/cs_test_123',
    });
    updateStripeCustomerIdMock.mockResolvedValue({});

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        classSessionId: '22222222-2222-4222-8222-222222222222',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({
      data: {
        url: 'https://checkout.stripe.test/session/cs_test_123',
        sessionId: 'cs_test_123',
      },
    });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          classSessionId: '22222222-2222-4222-8222-222222222222',
          planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        }),
        subscription_data: expect.objectContaining({
          metadata: expect.objectContaining({
            classSessionId: '22222222-2222-4222-8222-222222222222',
          }),
        }),
      }),
    );
    expect(updateStripeCustomerIdMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 'cus_123');
    expect(stripeCallMock).toHaveBeenCalled();
  });

  it('reuses existing stripe customer id when present', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByIdMock.mockResolvedValue({
      id: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
      stripePriceId: 'price_123',
      isActive: true,
    });
    findByIdMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ana@email.com',
      name: 'Ana',
      stripeCustomerId: 'cus_existing',
    });
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      id: 'cs_test_456',
      url: 'https://checkout.stripe.test/session/cs_test_456',
    });

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f',
        classSessionId: '22222222-2222-4222-8222-222222222222',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.data.sessionId).toBe('cs_test_456');
    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(updateStripeCustomerIdMock).not.toHaveBeenCalled();
  });
});
