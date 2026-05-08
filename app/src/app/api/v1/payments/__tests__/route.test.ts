import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';
import { paymentsService } from '@/modules/payments/services/payments.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/payments/services/payments.service', () => ({
  paymentsService: {
    listByUser: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const listByUserMock = paymentsService.listByUser as jest.Mock;

describe('GET /api/v1/payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/v1/payments');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(listByUserMock).not.toHaveBeenCalled();
  });

  it('uses default pagination when query params are absent', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listByUserMock.mockResolvedValue({ data: [{ id: 'pay-1' }], total: 1 });

    const req = new NextRequest('http://localhost/api/v1/payments');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listByUserMock).toHaveBeenCalledWith('user-1', { page: 1, limit: 20 });
    expect(body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(body.data).toEqual([{ id: 'pay-1' }]);
  });

  it('returns 400 for invalid pagination params', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    const req = new NextRequest('http://localhost/api/v1/payments?page=0&limit=999');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Invalid pagination parameters');
    expect(listByUserMock).not.toHaveBeenCalled();
  });
});
