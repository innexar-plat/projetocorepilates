import { POST } from '../route';
import { auth } from '@/lib/auth';
import { uploadImage } from '@/lib/minio';
import { galleryService } from '@/modules/gallery/services/gallery.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/minio', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('@/modules/gallery/services/gallery.service', () => ({
  galleryService: {
    create: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const uploadImageMock = uploadImage as jest.Mock;
const createMock = galleryService.create as jest.Mock;

describe('POST /api/v1/admin/gallery/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { role: 'CLIENT' } });

    const req = new Request('http://localhost/api/v1/admin/gallery/upload', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it('returns 400 when no file is sent', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });

    const req = new Request('http://localhost/api/v1/admin/gallery/upload', {
      method: 'POST',
      body: new FormData(),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('uploads multiple files and creates gallery records', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    uploadImageMock
      .mockResolvedValueOnce({ url: 'http://minio/gallery/1.webp' })
      .mockResolvedValueOnce({ url: 'http://minio/gallery/2.webp' });

    createMock
      .mockResolvedValueOnce({ id: '1', url: 'http://minio/gallery/1.webp', order: 10 })
      .mockResolvedValueOnce({ id: '2', url: 'http://minio/gallery/2.webp', order: 11 });

    const fd = new FormData();
    fd.append('files', new File(['a'], 'studio-a.webp', { type: 'image/webp' }));
    fd.append('files', new File(['b'], 'studio-b.webp', { type: 'image/webp' }));
    fd.append('title', 'Studio');
    fd.append('order', '10');
    fd.append('isActive', 'true');

    const req = new Request('http://localhost/api/v1/admin/gallery/upload', {
      method: 'POST',
      body: fd,
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(uploadImageMock).toHaveBeenCalledTimes(2);
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(body.data.data.created).toHaveLength(2);
    expect(body.data.data.failed).toHaveLength(0);
  });

  it('returns partial success when one file fails', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    uploadImageMock
      .mockResolvedValueOnce({ url: 'http://minio/gallery/1.webp' })
      .mockRejectedValueOnce(new Error('File too large'));

    createMock.mockResolvedValueOnce({ id: '1', url: 'http://minio/gallery/1.webp', order: 0 });

    const fd = new FormData();
    fd.append('files', new File(['a'], 'ok.webp', { type: 'image/webp' }));
    fd.append('files', new File(['b'], 'bad.webp', { type: 'image/webp' }));

    const req = new Request('http://localhost/api/v1/admin/gallery/upload', {
      method: 'POST',
      body: fd,
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.data.created).toHaveLength(1);
    expect(body.data.data.failed).toEqual([{ name: 'bad.webp', reason: 'File too large' }]);
  });
});
