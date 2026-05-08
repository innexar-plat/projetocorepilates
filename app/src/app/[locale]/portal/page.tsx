import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n/routing';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { resolvePortalFlow } from '@/lib/portal-flow';

type PortalIndexPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ checkout?: string }>;
};

export default async function PortalIndexPage({ params, searchParams }: PortalIndexPageProps) {
  const { locale } = await params;
  const { checkout } = await searchParams;
  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Stripe may redirect before all async webhook side effects are persisted.
  if (checkout === 'success') {
    redirect(`/${locale}/checkout/processando?checkout=success`);
  }

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

  redirect(`/${locale}${flow.nextStep}`);
}
