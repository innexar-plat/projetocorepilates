import { NextRequest } from 'next/server';
import { usersService } from '@/modules/users/services/users.service';
import { apiSuccess, apiError } from '@/lib/api';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

/**
 * POST /api/v1/auth/reset-password
 * Validates the reset token and sets a new password.
 * Token is single-use and expires after 1 hour.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkPublicRateLimit(ip)) {
    return apiError(new Error('Too Many Requests'), 429);
  }

  try {
    const body = await req.json();
    const { token, newPassword } = resetSchema.parse(body);
    await usersService.resetPassword(token, newPassword);
    return apiSuccess({ data: { message: 'Password updated successfully.' } });
  } catch (err) {
    return apiError(err);
  }
}
