import { POST } from '../route';
import { usersService } from '@/modules/users/services/users.service';
import { checkPublicRateLimit } from '@/lib/rate-limit';

jest.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    resetPassword: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  checkPublicRateLimit: jest.fn(),
}));

const resetPasswordMock = usersService.resetPassword as jest.Mock;
const checkPublicRateLimitMock = checkPublicRateLimit as jest.Mock;

describe('POST /api/v1/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkPublicRateLimitMock.mockReturnValue(true);
  });

  it('returns 429 when public rate limit is exceeded', async () => {
    checkPublicRateLimitMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'token', newPassword: 'StrongPass1' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe('Too Many Requests');
  });

  it('returns 400 when payload is invalid', async () => {
    const req = new Request('http://localhost/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: '', newPassword: 'weak' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
  });

  it('returns 200 and resets password for valid payload', async () => {
    resetPasswordMock.mockResolvedValue(undefined);

    const req = new Request('http://localhost/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'token_abc', newPassword: 'StrongPass1' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { message: 'Password updated successfully.' } });
    expect(resetPasswordMock).toHaveBeenCalledWith('token_abc', 'StrongPass1');
  });
});
