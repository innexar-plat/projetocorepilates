import { POST } from '../route';
import { usersService } from '@/modules/users/services/users.service';
import { checkPublicRateLimit } from '@/lib/rate-limit';

jest.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    forgotPassword: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  checkPublicRateLimit: jest.fn(),
}));

const forgotPasswordMock = usersService.forgotPassword as jest.Mock;
const checkPublicRateLimitMock = checkPublicRateLimit as jest.Mock;

describe('POST /api/v1/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkPublicRateLimitMock.mockReturnValue(true);
  });

  it('returns 429 when public rate limit is exceeded', async () => {
    checkPublicRateLimitMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'ana@example.com' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe('Too Many Requests');
  });

  it('returns 400 when payload is invalid', async () => {
    const req = new Request('http://localhost/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
  });

  it('returns 200 and calls forgotPassword for valid payload', async () => {
    forgotPasswordMock.mockResolvedValue(undefined);

    const req = new Request('http://localhost/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'ana@example.com' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { message: 'If that email is registered, a reset link has been sent.' } });
    expect(forgotPasswordMock).toHaveBeenCalledWith('ana@example.com');
  });
});
