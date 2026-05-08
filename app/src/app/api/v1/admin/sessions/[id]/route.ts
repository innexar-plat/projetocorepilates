import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { classSessionsService } from '@/modules/classes/services/class-sessions.service';
import { updateSessionSchema } from '@/modules/classes/repositories/class-sessions.repository';
import { apiSuccess, apiNoContent, apiError } from '@/lib/api';
import { UserRole, ClassSessionStatus } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/v1/admin/sessions/:id
 * Updates a class session (status, notes). Admin only.
 * Use to cancel a session or add notes.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    const body = await req.json();
    const dto = updateSessionSchema.parse(body);
    const updated = await classSessionsService.update(id, dto);
    return apiSuccess({ data: updated });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/admin/sessions/:id
 * Cancels a class session. Admin only.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    await classSessionsService.update(id, { status: ClassSessionStatus.CANCELED });
    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
