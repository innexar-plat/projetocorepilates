import { POST } from '../route';
import { auth } from '@/lib/auth';
import { referralsService } from '@/modules/referrals/services/referrals.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/referrals/services/referrals.service', () => ({
  referralsService: {
    convertByCode: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const convertByCodeMock = referralsService.convertByCode as jest.Mock;

describe('POST /api/v1/referrals/apply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABCDE12345' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid payload', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });

    const req = new Request('http://localhost/api/v1/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ code: '' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Bad Request');
  });

  it('applies referral code and returns success response', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    convertByCodeMock.mockResolvedValue({ id: 'ref-1', code: 'ABCDE12345', status: 'CONVERTED' });

    const req = new Request('http://localhost/api/v1/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ code: 'abcde12345' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ data: { id: 'ref-1', code: 'ABCDE12345', status: 'CONVERTED' } });
    expect(convertByCodeMock).toHaveBeenCalledWith('ABCDE12345', '11111111-1111-4111-8111-111111111111');
  });
});
