import { POST } from '../route';
import { usersService } from '@/modules/users/services/users.service';
import { referralsService } from '@/modules/referrals/services/referrals.service';
import { sendEmail } from '@/lib/resend';
import { checkPublicRateLimit } from '@/lib/rate-limit';

jest.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    create: jest.fn(),
  },
}));

jest.mock('@/modules/referrals/services/referrals.service', () => ({
  referralsService: {
    convertByCode: jest.fn(),
  },
}));

jest.mock('@/lib/resend', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkPublicRateLimit: jest.fn(),
}));

const usersServiceMock = jest.mocked(usersService);
const referralsServiceMock = jest.mocked(referralsService);
const sendEmailMock = jest.mocked(sendEmail);
const checkPublicRateLimitMock = jest.mocked(checkPublicRateLimit);

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkPublicRateLimitMock.mockReturnValue(true);
  });

  it('returns 429 when public rate limit is exceeded', async () => {
    checkPublicRateLimitMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe('Too Many Requests');
  });

  it('returns 400 when payload is invalid', async () => {
    const req = new Request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
      headers: { 'x-forwarded-for': '127.0.0.1' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('Validation failed');
    expect(Array.isArray(body.details)).toBe(true);
  });

  it('creates user and returns 201 with response contract', async () => {
    usersServiceMock.create.mockResolvedValue({
      id: 'user-1',
      name: 'Ana Silva',
      email: 'ana@email.com',
      role: 'CLIENT',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as any);
    referralsServiceMock.convertByCode.mockResolvedValue({} as any);
    sendEmailMock.mockResolvedValue(undefined as any);

    const req = new Request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        name: 'Ana Silva',
        email: 'ana@email.com',
        password: 'SenhaForte1',
        phone: '+5511999999999',
        referralCode: 'ABCDE12345',
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data).toMatchObject({
      id: 'user-1',
      name: 'Ana Silva',
      email: 'ana@email.com',
      role: 'CLIENT',
    });
    expect(usersServiceMock.create).toHaveBeenCalledTimes(1);
    expect(referralsServiceMock.convertByCode).toHaveBeenCalledWith('ABCDE12345', 'user-1');
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });
});
