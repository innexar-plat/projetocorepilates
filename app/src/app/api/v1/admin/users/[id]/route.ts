import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';
import { apiSuccess, apiNoContent, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'CLIENT']),
});

/**
 * GET /api/v1/admin/users/:id
 * Returns full user details. Admin only.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    const user = await usersService.getById(id);
    return apiSuccess({ data: user });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH /api/v1/admin/users/:id
 * Updates user role. Admin only.
 * Body: { role: 'ADMIN' | 'CLIENT' }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    const body = await req.json();
    const { role } = updateRoleSchema.parse(body);
    const updated = await usersService.updateRole(id, role);
    return apiSuccess({ data: updated });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/admin/users/:id
 * Soft deletes a user account. Admin only.
 * Prevents admin from self-deleting.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;

    if (id === session.user.id) {
      return apiError(new Error('Cannot delete your own admin account'), 400);
    }

    await usersService.softDelete(id);
    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
