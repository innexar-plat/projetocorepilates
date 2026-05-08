import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    list: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const listMock = usersService.list as jest.Mock;

describe('GET /api/v1/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new NextRequest('http://localhost/api/v1/admin/users');
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('uses defaults when query params are absent', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    listMock.mockResolvedValue({ items: [{ id: 'user-1' }], total: 1 });

    const req = new NextRequest('http://localhost/api/v1/admin/users');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      sortBy: 'createdAt',
      order: 'desc',
    });
    expect(body.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    expect(body.data).toEqual([{ id: 'user-1' }]);
  });

  it('applies query filters', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    listMock.mockResolvedValue({ items: [{ id: 'user-2' }], total: 1 });

    const req = new NextRequest(
      'http://localhost/api/v1/admin/users?page=2&limit=10&search=ana&sortBy=name&order=asc',
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'ana',
      sortBy: 'name',
      order: 'asc',
    });
  });

  it('returns 400 for invalid query params', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new NextRequest('http://localhost/api/v1/admin/users?page=0');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
    expect(listMock).not.toHaveBeenCalled();
  });
});
