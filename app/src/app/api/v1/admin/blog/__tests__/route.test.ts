import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { auth } from '@/lib/auth';
import { postsService } from '@/modules/blog/services/posts.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/blog/services/posts.service', () => ({
  postsService: {
    list: jest.fn(),
    create: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const listMock = postsService.list as jest.Mock;
const createMock = postsService.create as jest.Mock;

describe('GET /api/v1/admin/blog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new NextRequest('http://localhost/api/v1/admin/blog');
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('uses pagination defaults when query params are missing', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    listMock.mockResolvedValue({ items: [{ id: 'post-1' }], total: 1 });

    const req = new NextRequest('http://localhost/api/v1/admin/blog');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: undefined,
      search: undefined,
    });
    expect(body.data).toEqual([{ id: 'post-1' }]);
    expect(body.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('returns 400 for invalid query params', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new NextRequest('http://localhost/api/v1/admin/blog?page=0');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
    expect(listMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/admin/blog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/admin/blog', {
      method: 'POST',
      body: JSON.stringify({ title: 'Post' }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/admin/blog', {
      method: 'POST',
      body: '{"title": "broken"',
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Invalid JSON body');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates post and returns 201 for valid payload', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    createMock.mockResolvedValue({ id: 'post-1', title: 'Post' });

    const req = new Request('http://localhost/api/v1/admin/blog', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Post',
        slug: 'post',
        content: 'Body',
      }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith('admin-1', {
      title: 'Post',
      slug: 'post',
      content: 'Body',
      status: 'DRAFT',
    });
  });
});
