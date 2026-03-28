import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { clientProfilesService } from '@/modules/client-profiles/services/client-profiles.service';
import { clientProfileSchema } from '@/modules/client-profiles/dtos/client-profile.dto';
import { apiSuccess, apiCreated, apiError } from '@/lib/api';

/**
 * GET /api/v1/client-profiles
 * Returns the authenticated user's own client profile.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const profile = await clientProfilesService.getByUserId(session.user.id);
    return apiSuccess({ data: profile });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * POST /api/v1/client-profiles
 * Creates or updates the authenticated user's client profile.
 * Accepts partial data — use to save progress during onboarding.
 * Full completion is done via POST /api/v1/client-profiles/complete.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const dto = clientProfileSchema.partial().parse(body);
    const profile = await clientProfilesService.upsert(session.user.id, dto as never);
    return apiCreated({ data: profile });
  } catch (err) {
    return apiError(err);
  }
}
