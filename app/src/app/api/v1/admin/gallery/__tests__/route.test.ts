import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { auth } from '@/lib/auth';
import { galleryService } from '@/modules/gallery/services/gallery.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/gallery/services/gallery.service', () => ({
  galleryService: {
    listAll: jest.fn(),
    create: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const listAllMock = galleryService.listAll as jest.Mock;
const createMock = galleryService.create as jest.Mock;

describe('GET /api/v1/admin/gallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new NextRequest('http://localhost/api/v1/admin/gallery');
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(listAllMock).not.toHaveBeenCalled();
  });

  it('passes album filter to service for admins', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    listAllMock.mockResolvedValue([{ id: 'img-1' }]);

    const req = new NextRequest('http://localhost/api/v1/admin/gallery?album=Studio');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(listAllMock).toHaveBeenCalledWith(false, 'Studio');
    expect(body.data).toEqual([{ id: 'img-1' }]);
  });
});

describe('POST /api/v1/admin/gallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/admin/gallery', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/admin/gallery', {
      method: 'POST',
      body: '{"url": "https://img"',
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Invalid JSON body');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates image and returns 201 for valid payload', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    createMock.mockResolvedValue({ id: 'img-1', url: 'https://example.com/a.jpg' });

    const req = new Request('http://localhost/api/v1/admin/gallery', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com/a.jpg',
        order: 0,
        isActive: true,
      }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      url: 'https://example.com/a.jpg',
      order: 0,
      isActive: true,
    });
  });
});
