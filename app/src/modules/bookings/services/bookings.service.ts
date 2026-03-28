import { db } from '@/lib/db';
import { bookingsRepository } from '../repositories/bookings.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';
import { BookingStatus, SubscriptionStatus } from '@prisma/client';
import { sendEmail } from '@/lib/resend';
import type { CreateBookingDto } from '../dtos/booking.dto';

const CANCELLATION_WINDOW_HOURS = 24;

async function getActiveSubscription(userId: string) {
  const sub = await db.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE },
    include: { plan: true },
  });
  if (!sub) throw new ForbiddenError('Active subscription required to book a class');
  return sub;
}

async function getSession(classSessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: classSessionId },
    include: { class: true },
  });
  if (!session) throw new NotFoundError('Class session not found');
  return session;
}

export const bookingsService = {
  listByUser(userId: string) {
    return bookingsRepository.listByUser(userId);
  },

  async getById(id: string) {
    const booking = await bookingsRepository.findById(id);
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  },

  async book({ userId, classSessionId }: CreateBookingDto) {
    const [subscription, session] = await Promise.all([
      getActiveSubscription(userId),
      getSession(classSessionId),
    ]);

    // Prevent duplicate booking
    const existing = await bookingsRepository.findByUserAndSession(userId, classSessionId);
    if (existing) throw new ConflictError('You already have a booking for this session');

    const maxClasses = subscription.plan.classesPerMonth;
    const usedClasses = subscription.classesUsedThisMonth;
    const unlimited = maxClasses >= 999;

    if (!unlimited && usedClasses >= maxClasses) {
      throw new ForbiddenError('Monthly class limit reached');
    }

    const confirmedCount = await bookingsRepository.countConfirmedForSession(classSessionId);
    const isFull = confirmedCount >= session.class.maxCapacity;

    if (isFull) {
      // Add to waitlist
      return bookingsRepository.create({ userId, classSessionId, status: BookingStatus.WAITLIST });
    }

    // Confirm booking and deduct class credit
    const booking = await bookingsRepository.create({
      userId,
      classSessionId,
      status: BookingStatus.CONFIRMED,
    });

    if (!unlimited) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { classesUsedThisMonth: { increment: 1 } },
      });
    }

    return booking;
  },

  async cancel(bookingId: string, requestingUserId: string) {
    const booking = await bookingsService.getById(bookingId);

    if (booking.userId !== requestingUserId) throw new ForbiddenError('Cannot cancel another user\'s booking');
    if (booking.status === BookingStatus.CANCELED) throw new ConflictError('Booking is already cancelled');

    const sessionDate = booking.classSession.date;
    const hoursUntilClass = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const isWithinWindow = hoursUntilClass < CANCELLATION_WINDOW_HOURS;

    await bookingsRepository.updateStatus(bookingId, BookingStatus.CANCELED);

    // Return class credit only for confirmed bookings outside cancel window
    if (booking.status === BookingStatus.CONFIRMED && !isWithinWindow) {
      const subscription = await db.subscription.findFirst({
        where: { userId: requestingUserId, status: SubscriptionStatus.ACTIVE },
        include: { plan: true },
      });

      if (subscription && subscription.plan.classesPerMonth < 999) {
        await db.subscription.update({
          where: { id: subscription.id },
          data: { classesUsedThisMonth: { decrement: 1 } },
        });
      }
    }

    // Promote first waitlisted user
    if (booking.status === BookingStatus.CONFIRMED) {
      const waitlisted = await bookingsRepository.firstWaitlistForSession(booking.classSessionId);
      if (waitlisted) {
        await bookingsRepository.updateStatus(waitlisted.id, BookingStatus.CONFIRMED);

        const promotedUser = await db.user.findUnique({
          where: { id: waitlisted.userId },
          select: { email: true, name: true },
        });

        if (promotedUser) {
          await sendEmail({
            to: promotedUser.email,
            subject: 'Boa notícia! Sua vaga foi confirmada',
            html: `<p>Olá ${promotedUser.name}, sua reserva na lista de espera foi confirmada!</p>`,
          });
        }
      }
    }

    return booking;
  },
};
