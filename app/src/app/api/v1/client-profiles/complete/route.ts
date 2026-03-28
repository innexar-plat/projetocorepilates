import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { clientProfilesService } from '@/modules/client-profiles/services/client-profiles.service';
import { clientProfileSchema } from '@/modules/client-profiles/dtos/client-profile.dto';
import { apiSuccess, apiError } from '@/lib/api';

/**
 * POST /api/v1/client-profiles/complete
 * Validates the profile as fully complete (all required fields + consents + PAR-Q)
 * and automatically generates the contract awaiting client signature.
 *
 * Called at the end of the post-payment onboarding flow.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const dto = clientProfileSchema.parse(body);
    const profile = await clientProfilesService.complete(session.user.id, dto as never);
    return apiSuccess({ data: profile });
  } catch (err) {
    return apiError(err);
  }
}
