import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { referralsService } from '@/modules/referrals/services/referrals.service';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const applySchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
});

/**
 * POST /api/v1/referrals/apply
 * Applies a referral code to the authenticated user's account.
 *
 * A code can only be applied once per user. The referrer receives credit
 * when the code is successfully converted.
 *
 * Body: { code: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const { code } = applySchema.parse(body);

    const referral = await referralsService.convertByCode(code, session.user.id);
    return apiSuccess({ data: referral }, 200);
  } catch (err) {
    return apiError(err);
  }
}
