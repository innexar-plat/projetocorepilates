import { GET } from '../route';
import { auth } from '@/lib/auth';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/subscriptions/services/subscriptions.service', () => ({
  subscriptionsService: {
    getActiveByUserId: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const getActiveByUserIdMock = subscriptionsService.getActiveByUserId as jest.Mock;

describe('GET /api/v1/subscriptions/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated user id', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/subscriptions/me');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Authentication required');
  });

  it('returns active subscription for authenticated user', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getActiveByUserIdMock.mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' });

    const req = new Request('http://localhost/api/v1/subscriptions/me');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ id: 'sub-1', status: 'ACTIVE' });
    expect(getActiveByUserIdMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });
});
