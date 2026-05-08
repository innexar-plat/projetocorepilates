import { PATCH, DELETE } from '../route';
import { auth } from '@/lib/auth';
import { galleryService } from '@/modules/gallery/services/gallery.service';
import { NotFoundError } from '@/lib/errors';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/gallery/services/gallery.service', () => ({
  galleryService: {
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const updateMock = galleryService.update as jest.Mock;
const deleteMock = galleryService.delete as jest.Mock;

describe('PATCH /api/v1/admin/gallery/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new Request('http://localhost/api/v1/admin/gallery/img-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'img-1' }) } as any);

    expect(res.status).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/admin/gallery/img-1', {
      method: 'PATCH',
      body: '{"title": "broken"',
      headers: { 'content-type': 'application/json' },
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'img-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Invalid JSON body');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns 404 when image does not exist', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    updateMock.mockRejectedValue(new NotFoundError('Gallery image not found'));

    const req = new Request('http://localhost/api/v1/admin/gallery/img-404', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'img-404' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
    expect(updateMock).toHaveBeenCalledWith(
      'img-404',
      expect.objectContaining({ title: 'Updated' }),
    );
  });

  it('returns 200 for valid update', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    updateMock.mockResolvedValue({ id: 'img-1', title: 'Updated' });

    const req = new Request('http://localhost/api/v1/admin/gallery/img-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'img-1' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith('img-1', { title: 'Updated' });
    expect(body.data).toEqual({ data: { id: 'img-1', title: 'Updated' } });
  });
});

describe('DELETE /api/v1/admin/gallery/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/admin/gallery/img-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'img-1' }) } as any);

    expect(res.status).toBe(403);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('returns 404 when image does not exist', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    deleteMock.mockRejectedValue(new NotFoundError('Gallery image not found'));

    const req = new Request('http://localhost/api/v1/admin/gallery/img-404', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'img-404' }) } as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
    expect(deleteMock).toHaveBeenCalledWith('img-404');
  });

  it('returns 204 for successful delete', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    deleteMock.mockResolvedValue({ id: 'img-1' });

    const req = new Request('http://localhost/api/v1/admin/gallery/img-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 'img-1' }) } as any);

    expect(res.status).toBe(204);
    expect(deleteMock).toHaveBeenCalledWith('img-1');
  });
});
