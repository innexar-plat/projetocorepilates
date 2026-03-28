import { auth } from '@/lib/auth';
import { referralsService } from '@/modules/referrals/services/referrals.service';
import { apiSuccess, apiError } from '@/lib/api';

// GET /api/v1/referrals — get current user's referral code and history
export async function GET() {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const [referral, history] = await Promise.all([
      referralsService.getOrCreateCode(session.user.id),
      referralsService.listByUser(session.user.id),
    ]);

    return apiSuccess({ data: { code: referral.code, history } });
  } catch (err) {
    return apiError(err);
  }
}
