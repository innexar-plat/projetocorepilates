import { POST } from '../route';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';
import { uploadImage } from '@/lib/minio';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    update: jest.fn(),
  },
}));

jest.mock('@/lib/minio', () => ({
  uploadImage: jest.fn(),
}));

const authMock = auth as jest.Mock;
const updateMock = usersService.update as jest.Mock;
const uploadImageMock = uploadImage as jest.Mock;

describe('POST /api/v1/users/me/avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/users/me/avatar', { method: 'POST' });
    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when no avatar file is provided', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });

    const formData = new FormData();
    const req = new Request('http://localhost/api/v1/users/me/avatar', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
  });

  it('returns 400 when file type is invalid', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });

    const formData = new FormData();
    const invalidFile = new File(['avatar-content'], 'avatar.gif', { type: 'image/gif' });
    formData.set('avatar', invalidFile);

    const req = new Request('http://localhost/api/v1/users/me/avatar', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
  });

  it('uploads avatar and returns 200', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    uploadImageMock.mockResolvedValue({ url: 'https://cdn.example.com/avatars/user-1.webp' });
    updateMock.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      avatarUrl: 'https://cdn.example.com/avatars/user-1.webp',
    });

    const formData = new FormData();
    const validFile = new File(['avatar-content'], 'avatar.webp', { type: 'image/webp' });
    formData.set('avatar', validFile);

    const req = new Request('http://localhost/api/v1/users/me/avatar', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { avatarUrl: 'https://cdn.example.com/avatars/user-1.webp' } });
    expect(uploadImageMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', {
      avatarUrl: 'https://cdn.example.com/avatars/user-1.webp',
    });
  });
});
