import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { resolvePortalFlow } from '@/lib/portal-flow';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const userId = session.user.id;

    const [subscription, bookingsCount, succeededPaymentsCount, profile] = await Promise.all([
      db.subscription.findUnique({
        where: { userId },
        select: { status: true },
      }),
      db.booking.count({
        where: {
          userId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.ATTENDED, BookingStatus.WAITLIST] },
        },
      }),
      db.payment.count({
        where: {
          userId,
          status: PaymentStatus.SUCCEEDED,
        },
      }),
      db.clientProfile.findUnique({
        where: { userId },
        select: { isComplete: true },
      }),
    ]);

    const hasPlan = !!subscription;
    const hasBooking = bookingsCount > 0;
    const hasPayment = succeededPaymentsCount > 0;
    const profileCompleted = !!profile?.isComplete;

    const flow = resolvePortalFlow({
      hasPlan,
      hasBooking,
      hasPayment,
      profileCompleted,
      subscriptionStatus: subscription?.status,
    });

    return apiSuccess({
      hasPlan,
      hasActiveSubscription: flow.hasActiveSubscription,
      hasBooking,
      hasPayment,
      canStartOnboarding: flow.canStartOnboarding,
      profileCompleted,
      nextStep: flow.nextStep,
    });
  } catch (err) {
    return apiError(err);
  }
}
