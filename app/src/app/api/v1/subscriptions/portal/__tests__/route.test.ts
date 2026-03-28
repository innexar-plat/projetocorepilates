import { POST } from '../route';
import { auth } from '@/lib/auth';
import { usersRepository } from '@/modules/users/repositories/users.repository';
import { stripe, stripeCall } from '@/lib/stripe';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/users/repositories/users.repository', () => ({
  usersRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
  stripeCall: jest.fn((_: string, fn: () => Promise<unknown>) => fn()),
}));

const authMock = auth as jest.Mock;
const findByIdMock = usersRepository.findById as jest.Mock;
const stripeCallMock = stripeCall as jest.Mock;
const portalCreateMock = stripe.billingPortal.sessions.create as jest.Mock;

describe('POST /api/v1/subscriptions/portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/subscriptions/portal', { method: 'POST' });
    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 422 when user has no billing account', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    findByIdMock.mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111', stripeCustomerId: null });

    const req = new Request('http://localhost/api/v1/subscriptions/portal', { method: 'POST' });
    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toBe('Unprocessable Entity');
  });

  it('returns portal url when session is created', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    findByIdMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      stripeCustomerId: 'cus_123',
    });
    portalCreateMock.mockResolvedValue({
      url: 'https://billing.stripe.com/p/session_123',
    });

    const req = new Request('http://localhost/api/v1/subscriptions/portal', { method: 'POST' });
    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(stripeCallMock).toHaveBeenCalledTimes(1);
    expect(body.data).toEqual({ data: { url: 'https://billing.stripe.com/p/session_123' } });
  });
});
