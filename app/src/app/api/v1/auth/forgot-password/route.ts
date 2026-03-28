import { NextRequest } from 'next/server';
import { usersService } from '@/modules/users/services/users.service';
import { apiSuccess, apiError } from '@/lib/api';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const forgotSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/v1/auth/forgot-password
 * Sends a password reset email if the email is registered.
 * Always returns 200 to prevent email enumeration attacks.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkPublicRateLimit(ip)) {
    return apiError(new Error('Too Many Requests'), 429);
  }

  try {
    const body = await req.json();
    const { email } = forgotSchema.parse(body);
    await usersService.forgotPassword(email); // silent — never reveals if email exists
    return apiSuccess({ data: { message: 'If that email is registered, a reset link has been sent.' } });
  } catch (err) {
    return apiError(err);
  }
}
