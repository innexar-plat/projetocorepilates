import { PATCH, DELETE } from '../route';
import { auth } from '@/lib/auth';
import { galleryService } from '@/modules/gallery/services/gallery.service';
import { NotFoundError } from '@/lib/errors';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/gallery/services/gallery.service', () => ({
  galleryService: {
    updateAlbum: jest.fn(),
    deleteAlbum: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const updateAlbumMock = galleryService.updateAlbum as jest.Mock;
const deleteAlbumMock = galleryService.deleteAlbum as jest.Mock;

describe('PATCH /api/v1/admin/gallery/albums/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new Request('http://localhost/api/v1/admin/gallery/albums/alb-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'alb-1' }) } as any);

    expect(res.status).toBe(403);
    expect(updateAlbumMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/admin/gallery/albums/alb-1', {
      method: 'PATCH',
      body: '{"name": "broken"',
      headers: { 'content-type': 'application/json' },
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'alb-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Invalid JSON body');
    expect(updateAlbumMock).not.toHaveBeenCalled();
  });

  it('returns 404 when album does not exist', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    updateAlbumMock.mockRejectedValue(new NotFoundError('Gallery album not found'));

    const req = new Request('http://localhost/api/v1/admin/gallery/albums/alb-404', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'alb-404' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
    expect(updateAlbumMock).toHaveBeenCalledWith(
      'alb-404',
      expect.objectContaining({ name: 'Updated' }),
    );
  });

  it('returns 200 for valid update', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    updateAlbumMock.mockResolvedValue({ id: 'alb-1', name: 'Updated' });

    const req = new Request('http://localhost/api/v1/admin/gallery/albums/alb-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'alb-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateAlbumMock).toHaveBeenCalledWith('alb-1', { name: 'Updated' });
    expect(body.data).toEqual({ data: { id: 'alb-1', name: 'Updated' } });
  });
});

describe('DELETE /api/v1/admin/gallery/albums/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/admin/gallery/albums/alb-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'alb-1' }) } as any);

    expect(res.status).toBe(403);
    expect(deleteAlbumMock).not.toHaveBeenCalled();
  });

  it('returns 404 when album does not exist', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    deleteAlbumMock.mockRejectedValue(new NotFoundError('Gallery album not found'));

    const req = new Request('http://localhost/api/v1/admin/gallery/albums/alb-404', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'alb-404' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
    expect(deleteAlbumMock).toHaveBeenCalledWith('alb-404');
  });

  it('returns 204 for successful delete', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    deleteAlbumMock.mockResolvedValue({ id: 'alb-1' });

    const req = new Request('http://localhost/api/v1/admin/gallery/albums/alb-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'alb-1' }) } as any);

    expect(res.status).toBe(204);
    expect(deleteAlbumMock).toHaveBeenCalledWith('alb-1');
  });
});
