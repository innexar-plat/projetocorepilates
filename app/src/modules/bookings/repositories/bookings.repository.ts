import { db } from '@/lib/db';
import { BookingStatus } from '@prisma/client';

export const bookingsRepository = {
  findById(id: string) {
    return db.booking.findUnique({
      where: { id },
      include: { classSession: true },
    });
  },

  findByUserAndSession(userId: string, classSessionId: string) {
    return db.booking.findFirst({
      where: { userId, classSessionId, status: { not: BookingStatus.CANCELED } },
    });
  },

  listByUser(userId: string) {
    return db.booking.findMany({
      where: { userId },
      include: { classSession: { include: { class: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  countConfirmedForSession(classSessionId: string) {
    return db.booking.count({
      where: { classSessionId, status: BookingStatus.CONFIRMED },
    });
  },

  firstWaitlistForSession(classSessionId: string) {
    return db.booking.findFirst({
      where: { classSessionId, status: BookingStatus.WAITLIST },
      orderBy: { createdAt: 'asc' },
    });
  },

  create(data: { userId: string; classSessionId: string; status: BookingStatus }) {
    return db.booking.create({ data });
  },

  updateStatus(id: string, status: BookingStatus) {
    return db.booking.update({ where: { id }, data: { status } });
  },
};

