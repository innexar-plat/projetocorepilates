import { referralsService } from '../services/referrals.service';
import { db } from '@/lib/db';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { ReferralStatus } from '@prisma/client';

jest.mock('nanoid', () => ({ nanoid: () => 'ABCDE12345' }));
jest.mock('@/lib/db', () => ({
  db: {
    referral: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockDb = jest.mocked(db);

const USER_ID = 'user-uuid-1';
const REFERRED_ID = 'user-uuid-2';

const fakeReferral = {
  id: 'referral-id',
  referrerId: USER_ID,
  referredId: null,
  code: 'ABCDE12345',
  status: ReferralStatus.PENDING,
  rewardPaid: false,
  createdAt: new Date(),
  convertedAt: null,
};

describe('referralsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getOrCreateCode()', () => {
    it('returns existing open referral code if one exists', async () => {
      mockDb.referral.findFirst.mockResolvedValue(fakeReferral as any);
      const result = await referralsService.getOrCreateCode(USER_ID);
      expect(mockDb.referral.create).not.toHaveBeenCalled();
      expect(result.code).toBe('ABCDE12345');
    });

    it('creates a new referral code when none exists', async () => {
      mockDb.referral.findFirst.mockResolvedValue(null);
      mockDb.referral.create.mockResolvedValue(fakeReferral as any);
      const result = await referralsService.getOrCreateCode(USER_ID);
      expect(mockDb.referral.create).toHaveBeenCalledWith({
        data: { referrerId: USER_ID, code: 'ABCDE12345' },
      });
      expect(result.code).toBe('ABCDE12345');
    });
  });

  describe('listByUser()', () => {
    it('returns all referrals for the user', async () => {
      const converted = { ...fakeReferral, referredId: REFERRED_ID, status: ReferralStatus.CONVERTED };
      mockDb.referral.findMany.mockResolvedValue([fakeReferral, converted] as any);
      const result = await referralsService.listByUser(USER_ID);
      expect(mockDb.referral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { referrerId: USER_ID } }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('convertByCode()', () => {
    it('converts a valid unused referral code', async () => {
      mockDb.referral.findUnique.mockResolvedValue(fakeReferral as any);
      const converted = {
        ...fakeReferral,
        referredId: REFERRED_ID,
        status: ReferralStatus.CONVERTED,
        convertedAt: new Date(),
      };
      mockDb.referral.update.mockResolvedValue(converted as any);

      const result = await referralsService.convertByCode('ABCDE12345', REFERRED_ID);
      expect(mockDb.referral.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referredId: REFERRED_ID, status: ReferralStatus.CONVERTED }),
        }),
      );
      expect(result.status).toBe(ReferralStatus.CONVERTED);
    });

    it('throws NotFoundError when code does not exist', async () => {
      mockDb.referral.findUnique.mockResolvedValue(null);
      await expect(referralsService.convertByCode('INVALID', REFERRED_ID)).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when code is already used', async () => {
      mockDb.referral.findUnique.mockResolvedValue({ ...fakeReferral, referredId: 'someone-else' } as any);
      await expect(referralsService.convertByCode('ABCDE12345', REFERRED_ID)).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when user tries to refer themselves', async () => {
      mockDb.referral.findUnique.mockResolvedValue(fakeReferral as any);
      await expect(referralsService.convertByCode('ABCDE12345', USER_ID)).rejects.toThrow(ConflictError);
    });
  });
});
