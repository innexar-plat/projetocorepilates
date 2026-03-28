import { GET, POST } from '../route';
import { auth } from '@/lib/auth';
import { leadsService } from '@/modules/leads/services/leads.service';
import { checkPublicRateLimit } from '@/lib/rate-limit';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/leads/services/leads.service', () => ({
  leadsService: {
    capture: jest.fn(),
    list: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  checkPublicRateLimit: jest.fn(),
}));

const authMock = auth as jest.Mock;
const captureMock = leadsService.capture as jest.Mock;
const listMock = leadsService.list as jest.Mock;
const checkPublicRateLimitMock = checkPublicRateLimit as jest.Mock;

describe('POST /api/v1/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkPublicRateLimitMock.mockReturnValue(true);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    checkPublicRateLimitMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe('Too Many Requests');
  });

  it('returns 400 for invalid payload', async () => {
    const req = new Request('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ name: 'A', email: 'invalid' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
  });

  it('returns 201 with lead id when capture succeeds', async () => {
    captureMock.mockResolvedValue({ id: 'lead-1' });

    const req = new Request('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        name: 'Ana Silva',
        email: 'ana@email.com',
        phone: '+5511999999999',
        source: 'landing-page',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data).toEqual({ data: { id: 'lead-1' } });
    expect(captureMock).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/v1/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { id: '1', role: 'CLIENT' } });

    const req = {
      nextUrl: new URL('http://localhost/api/v1/leads?page=1&limit=20'),
    };
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('returns paginated leads for admin', async () => {
    authMock.mockResolvedValue({ user: { id: '1', role: 'ADMIN' } });
    listMock.mockResolvedValue({ data: [{ id: 'lead-1' }], total: 1 });

    const req = {
      nextUrl: new URL('http://localhost/api/v1/leads?page=2&limit=10&status=NEW&search=ana'),
    };
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([{ id: 'lead-1' }]);
    expect(body.meta).toEqual({ total: 1, page: 2, limit: 10, totalPages: 1 });
    expect(listMock).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      status: 'NEW',
      search: 'ana',
    });
  });
});
