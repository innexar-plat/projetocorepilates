import { NextRequest } from 'next/server';
import { usersService } from '@/modules/users/services/users.service';
import { referralsService } from '@/modules/referrals/services/referrals.service';
import { createUserSchema } from '@/modules/users/dtos/user.dto';
import { sendEmail } from '@/lib/resend';
import { apiSuccess, apiClientError, handleApiError } from '@/lib/api';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkPublicRateLimit(ip)) {
    return apiClientError(429, 'Too Many Requests', 'Rate limit exceeded. Please try again later.');
  }

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return apiClientError(400, 'Bad Request', 'Validation failed', parsed.error.issues);
    }

    const user = await usersService.create(parsed.data);
    if (!user) throw new Error('User creation failed');

    // Apply referral code if provided
    if (parsed.data.referralCode) {
      await referralsService.convertByCode(parsed.data.referralCode, user.id).catch((err) => {
        logger.warn({ err, userId: user.id }, 'Referral conversion failed during registration');
        return null;
      });
    }

    // Send welcome email (best-effort — does not block registration)
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Brazilian Core Pilates! 🎉',
      html: `
        <h2>Welcome, ${user.name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Complete your profile now so our instructors can prepare your personalized experience:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://braziliancorepilates.com'}/portal/profile" style="font-weight:bold">Complete My Profile</a></p>
        <p>We can't wait to see you on the mat!</p>
        <hr />
        <p style="color:#999;font-size:12px">Brazilian Core Pilates</p>
      `,
    }).catch((err) => {
      logger.warn({ err, userId: user.id }, 'Welcome email failed during registration');
      return null;
    });

    return apiSuccess(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
