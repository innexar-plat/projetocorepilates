import { db } from '@/lib/db';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { ReferralStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

export const referralsService = {
  async getOrCreateCode(userId: string) {
    const existing = await db.referral.findFirst({
      where: { referrerId: userId, referredId: null },
    });
    if (existing) return existing;

    const code = nanoid(10).toUpperCase();
    return db.referral.create({
      data: { referrerId: userId, code },
    });
  },

  async listByUser(userId: string) {
    return db.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async convertByCode(code: string, referredId: string) {
    const referral = await db.referral.findUnique({ where: { code } });
    if (!referral) throw new NotFoundError('Referral code not found');
    if (referral.referredId) throw new ConflictError('Referral code already used');
    if (referral.referrerId === referredId) throw new ConflictError('Cannot refer yourself');

    return db.referral.update({
      where: { code },
      data: {
        referredId,
        status: ReferralStatus.CONVERTED,
        convertedAt: new Date(),
      },
    });
  },
};
