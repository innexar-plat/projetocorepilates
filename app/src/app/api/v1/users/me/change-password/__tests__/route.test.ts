import { POST } from '../route';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    changePassword: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const changePasswordMock = usersService.changePassword as jest.Mock;

describe('POST /api/v1/users/me/change-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'CurrentPass1',
        newPassword: 'NewPass123',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when payload is invalid', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });

    const req = new Request('http://localhost/api/v1/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: '',
        newPassword: 'weak',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
  });

  it('returns 200 when password is changed', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    changePasswordMock.mockResolvedValue(undefined);

    const req = new Request('http://localhost/api/v1/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'CurrentPass1',
        newPassword: 'NewPass123',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { message: 'Password changed successfully.' } });
    expect(changePasswordMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', {
      currentPassword: 'CurrentPass1',
      newPassword: 'NewPass123',
    });
  });
});
