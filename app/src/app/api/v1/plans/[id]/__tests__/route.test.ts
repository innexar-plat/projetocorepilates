import { GET, PATCH, DELETE } from '../route';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/plans/services/plans.service', () => ({
  plansService: {
    getById: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const getByIdMock = plansService.getById as jest.Mock;
const updateMock = plansService.update as jest.Mock;
const deactivateMock = plansService.deactivate as jest.Mock;

describe('GET /api/v1/plans/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns plan details by id', async () => {
    getByIdMock.mockResolvedValue({ id: 'plan-1', name: 'Starter' });

    const req = new Request('http://localhost/api/v1/plans/plan-1');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'plan-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { id: 'plan-1', name: 'Starter' } });
  });
});

describe('PATCH /api/v1/plans/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/plans/plan-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Plan' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'plan-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('updates plan for admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    updateMock.mockResolvedValue({ id: 'plan-1', name: 'Updated Plan' });

    const req = new Request('http://localhost/api/v1/plans/plan-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Plan' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'plan-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { id: 'plan-1', name: 'Updated Plan' } });
    expect(updateMock).toHaveBeenCalledWith('plan-1', { name: 'Updated Plan' });
  });
});

describe('DELETE /api/v1/plans/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/plans/plan-1', { method: 'DELETE' });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'plan-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('deactivates plan and returns 204 for admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    deactivateMock.mockResolvedValue(undefined);

    const req = new Request('http://localhost/api/v1/plans/plan-1', { method: 'DELETE' });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'plan-1' }) } as any);

    expect(res.status).toBe(204);
    expect(deactivateMock).toHaveBeenCalledWith('plan-1');
  });
});
