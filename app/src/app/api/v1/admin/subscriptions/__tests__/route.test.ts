import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const authMock = auth as jest.Mock;
const dbMock = db as jest.Mocked<typeof db>;

describe('GET /api/v1/admin/subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new NextRequest('http://localhost/api/v1/admin/subscriptions');
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(dbMock.subscription.findMany).not.toHaveBeenCalled();
    expect(dbMock.subscription.count).not.toHaveBeenCalled();
  });

  it('uses default pagination when query params are absent', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    dbMock.subscription.findMany.mockResolvedValue([{ id: 'sub-1' }] as any);
    dbMock.subscription.count.mockResolvedValue(1 as never);

    const req = new NextRequest('http://localhost/api/v1/admin/subscriptions');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(dbMock.subscription.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(dbMock.subscription.count).toHaveBeenCalledWith({ where: {} });
    expect(body.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    expect(body.data).toEqual([{ id: 'sub-1' }]);
  });

  it('applies status filter when provided', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    dbMock.subscription.findMany.mockResolvedValue([{ id: 'sub-1' }] as any);
    dbMock.subscription.count.mockResolvedValue(1 as never);

    const req = new NextRequest('http://localhost/api/v1/admin/subscriptions?page=2&limit=10&status=ACTIVE');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(dbMock.subscription.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      skip: 10,
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(dbMock.subscription.count).toHaveBeenCalledWith({ where: { status: 'ACTIVE' } });
  });

  it('returns 400 for invalid query params', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new NextRequest('http://localhost/api/v1/admin/subscriptions?page=0');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
    expect(dbMock.subscription.findMany).not.toHaveBeenCalled();
  });
});
