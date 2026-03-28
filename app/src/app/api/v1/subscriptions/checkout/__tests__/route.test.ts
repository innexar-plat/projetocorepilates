import { POST } from '../route';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/plans/services/plans.service', () => ({
  plansService: {
    getActiveById: jest.fn(),
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

const authMock = auth as jest.Mock;
const getActiveByIdMock = plansService.getActiveById as jest.Mock;
const findByIdMock = usersRepository.findById as jest.Mock;
const updateStripeCustomerIdMock = usersRepository.updateStripeCustomerId as jest.Mock;
const stripeCallMock = stripeCall as jest.Mock;

describe('POST /api/v1/subscriptions/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f' }),
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
      body: JSON.stringify({ planId: 'invalid-uuid' }),
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
      body: JSON.stringify({ planId: '4f1f4f2c-0bd6-48a1-a6ab-59c6312c6a4f' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
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
