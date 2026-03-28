import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { clientProfilesService } from '@/modules/client-profiles/services/client-profiles.service';
import { physicalAssessmentSchema } from '@/modules/client-profiles/dtos/client-profile.dto';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

type Params = { params: Promise<{ userId: string }> };

/**
 * PATCH /api/v1/admin/client-profiles/:userId/assessment
 * Instructor fills the physical assessment after an onboarding session. Admin only.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { userId } = await params;
    const body = await req.json();
    const dto = physicalAssessmentSchema.parse(body);
    const updated = await clientProfilesService.updateAssessment(userId, dto, session.user.id);
    return apiSuccess({ data: updated });
  } catch (err) {
    return apiError(err);
  }
}
