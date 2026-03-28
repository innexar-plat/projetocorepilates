import { GET, POST } from '../route';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/plans/services/plans.service', () => ({
  plansService: {
    listAll: jest.fn(),
    create: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const listAllMock = plansService.listAll as jest.Mock;
const createMock = plansService.create as jest.Mock;

describe('GET /api/v1/plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active plans publicly', async () => {
    listAllMock.mockResolvedValue([{ id: 'plan-1' }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listAllMock).toHaveBeenCalledWith(true);
    expect(body.data).toEqual({ data: [{ id: 'plan-1' }] });
  });
});

describe('POST /api/v1/plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/plans', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid payload', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/plans', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
  });

  it('creates plan and returns 201 for admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    createMock.mockResolvedValue({ id: 'plan-1', name: 'Premium' });

    const req = new Request('http://localhost/api/v1/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Premium',
        price: 299.99,
        classesPerMonth: 8,
        stripePriceId: 'price_123',
        stripeProductId: 'prod_123',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data).toEqual({ data: { id: 'plan-1', name: 'Premium' } });
  });
});
