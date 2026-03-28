import { GET } from '../route';
import { auth } from '@/lib/auth';
import { referralsService } from '@/modules/referrals/services/referrals.service';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/modules/referrals/services/referrals.service', () => ({
  referralsService: {
    getOrCreateCode: jest.fn(),
    listByUser: jest.fn(),
  },
}));

const authMock = auth as jest.Mock;
const getOrCreateCodeMock = referralsService.getOrCreateCode as jest.Mock;
const listByUserMock = referralsService.listByUser as jest.Mock;

describe('GET /api/v1/referrals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    authMock.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns referral code and history for authenticated user', async () => {
    authMock.mockResolvedValue({ user: { id: '11111111-1111-4111-8111-111111111111' } });
    getOrCreateCodeMock.mockResolvedValue({ code: 'ABCDE12345' });
    listByUserMock.mockResolvedValue([{ id: 'r-1', status: 'PENDING' }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({
      data: {
        code: 'ABCDE12345',
        history: [{ id: 'r-1', status: 'PENDING' }],
      },
    });
    expect(getOrCreateCodeMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
    expect(listByUserMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });
});
