import type { Booking, PortalClassSession } from '@/services/portal.service';
import type { CheckoutSession } from '@/utils/checkout-flow';

const BOOKING_PRIORITY = ['CONFIRMED', 'ATTENDED', 'WAITLIST'];

function bookingPriority(status: string) {
  const index = BOOKING_PRIORITY.indexOf(status);
  return index === -1 ? BOOKING_PRIORITY.length : index;
}

export function deriveEnrolledClassId(bookings: Booking[]) {
  const sorted = [...bookings].sort((left, right) => {
    const priorityDiff = bookingPriority(left.status) - bookingPriority(right.status);
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  for (const booking of sorted) {
    const classId = booking.classSession?.class?.id;
    if (classId) return classId;
  }

  return null;
}

export function toCheckoutSessions(sessions: PortalClassSession[]): CheckoutSession[] {
  return sessions.map((session) => ({
    id: session.id,
    date: session.date,
    class: {
      id: session.class.id,
      title: session.class.title,
      instructor: session.class.instructor,
      startTime: session.class.startTime,
      maxCapacity: session.class.maxCapacity,
      durationMin: session.class.durationMin,
    },
    bookedCount: session.bookedCount,
    availableSlots: session.availableSlots,
    isAvailable: session.isAvailable,
  }));
}
