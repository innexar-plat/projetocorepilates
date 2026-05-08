import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { classesService } from '@/modules/classes/services/classes.service';
import { updateClassSchema } from '@/modules/classes/dtos/class.dto';
import { apiSuccess, apiNoContent, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/classes/:id
 * Returns details for a single pilates class. Public endpoint.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const cls = await classesService.getById(id);
    return apiSuccess({ data: cls });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH /api/v1/classes/:id
 * Updates a pilates class. Admin only.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    const body = await req.json();
    const dto = updateClassSchema.parse(body);
    const cls = await classesService.update(id, dto);
    return apiSuccess({ data: cls });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/classes/:id
 * Deactivates a pilates class. Admin only.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    await classesService.deactivate(id);
    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
