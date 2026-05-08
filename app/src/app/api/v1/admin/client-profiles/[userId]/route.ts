import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { clientProfilesService } from '@/modules/client-profiles/services/client-profiles.service';
import { clientProfileSchema } from '@/modules/client-profiles/dtos/client-profile.dto';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/client-profiles/:userId
 * Returns full client profile for a given user. Admin only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const profile = await clientProfilesService.getByUserId(params.userId);
    return apiSuccess({ data: profile });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH /api/v1/admin/client-profiles/:userId
 * Allows admin to update any field of a client profile (e.g. physical assessment notes).
 * Admin only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const dto = clientProfileSchema.partial().parse(body);
    const updated = await clientProfilesService.upsert(params.userId, dto as never);
    return apiSuccess({ data: updated });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/admin/client-profiles/:userId
 * Removes a client profile and its related contract (if exists). Admin only.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    await clientProfilesService.removeByUserId(params.userId);
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    return apiError(err);
  }
}
