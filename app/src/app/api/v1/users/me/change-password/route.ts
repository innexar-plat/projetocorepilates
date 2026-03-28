import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';
import { changePasswordSchema } from '@/modules/users/dtos/user.dto';
import { apiSuccess, apiError } from '@/lib/api';

/**
 * POST /api/v1/users/me/change-password
 * Changes the authenticated user's password.
 * Requires the current password for verification.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const dto = changePasswordSchema.parse(body);
    await usersService.changePassword(session.user.id, dto);
    return apiSuccess({ data: { message: 'Password changed successfully.' } });
  } catch (err) {
    return apiError(err);
  }
}
