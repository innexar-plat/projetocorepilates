import { DELETE } from '../route';
import { auth } from '@/lib/auth';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';
import { stripe, stripeCall } from '@/lib/stripe';
import { db } from '@/lib/db';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/subscriptions/services/subscriptions.service', () => ({
  subscriptionsService: {
    getActiveByUserId: jest.fn(),
  },
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      update: jest.fn(),
    },
  },
  stripeCall: jest.fn((_: string, fn: () => Promise<unknown>) => fn()),
}));

const authMock = auth as jest.Mock;
const getActiveByUserIdMock = subscriptionsService.getActiveByUserId as jest.Mock;
const findFirstMock = db.subscription.findFirst as jest.Mock;
const stripeCallMock = stripeCall as jest.Mock;

describe('DELETE /api/v1/subscriptions/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/subscriptions/cancel', { method: 'DELETE' });
    const res = await DELETE(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when subscription has no stripeSubscriptionId', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByUserIdMock.mockResolvedValue({ id: 'sub-1', stripeSubscriptionId: null });

    const req = new Request('http://localhost/api/v1/subscriptions/cancel', { method: 'DELETE' });
    const res = await DELETE(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
  });

  it('returns 404 when db subscription lookup fails ownership check', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByUserIdMock.mockResolvedValue({ id: 'sub-1', stripeSubscriptionId: 'sub_stripe_123' });
    findFirstMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/subscriptions/cancel', { method: 'DELETE' });
    const res = await DELETE(req as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
  });

  it('returns 204 when cancellation at period end succeeds', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByUserIdMock.mockResolvedValue({ id: 'sub-1', stripeSubscriptionId: 'sub_stripe_123' });
    findFirstMock.mockResolvedValue({ id: 'sub-1' });
    (stripe.subscriptions.update as jest.Mock).mockResolvedValue({ id: 'sub_stripe_123' });

    const req = new Request('http://localhost/api/v1/subscriptions/cancel', { method: 'DELETE' });
    const res = await DELETE(req as any);

    expect(res.status).toBe(204);
    expect(stripeCallMock).toHaveBeenCalledTimes(1);
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_stripe_123', {
      cancel_at_period_end: true,
    });
  });
});
