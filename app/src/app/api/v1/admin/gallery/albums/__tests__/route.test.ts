import { GET, POST } from '../route';
import { auth } from '@/lib/auth';
import { galleryService } from '@/modules/gallery/services/gallery.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/gallery/services/gallery.service', () => ({
  galleryService: {
    listAlbums: jest.fn(),
    createAlbum: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const listAlbumsMock = galleryService.listAlbums as jest.Mock;
const createAlbumMock = galleryService.createAlbum as jest.Mock;

describe('GET /api/v1/admin/gallery/albums', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(listAlbumsMock).not.toHaveBeenCalled();
  });

  it('returns albums for admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    listAlbumsMock.mockResolvedValue([{ id: 'alb-1', name: 'Studio' }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: [{ id: 'alb-1', name: 'Studio' }] });
  });
});

describe('POST /api/v1/admin/gallery/albums', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/admin/gallery/albums', {
      method: 'POST',
      body: JSON.stringify({ name: 'Studio' }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(403);
    expect(createAlbumMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/admin/gallery/albums', {
      method: 'POST',
      body: '{"name": "Studio"',
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Invalid JSON body');
    expect(createAlbumMock).not.toHaveBeenCalled();
  });

  it('creates album and returns 201 for valid payload', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    createAlbumMock.mockResolvedValue({ id: 'alb-1', name: 'Studio' });

    const req = new Request('http://localhost/api/v1/admin/gallery/albums', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Studio',
        order: 0,
        isActive: true,
      }),
    });

    const res = await POST(req as any);

    expect(res.status).toBe(201);
    expect(createAlbumMock).toHaveBeenCalledWith({
      name: 'Studio',
      order: 0,
      isActive: true,
    });
  });
});
