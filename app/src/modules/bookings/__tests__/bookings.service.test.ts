import { bookingsService } from '../services/bookings.service';
import { bookingsRepository } from '../repositories/bookings.repository';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/resend';
import { NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';
import { BookingStatus, SubscriptionStatus, ClassSessionStatus } from '@prisma/client';

jest.mock('../repositories/bookings.repository');
jest.mock('@/lib/db', () => ({
  db: {
    subscription: { findFirst: jest.fn(), update: jest.fn() },
    classSession: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));
jest.mock('@/lib/resend', () => ({ sendEmail: jest.fn() }));

const mockRepo = jest.mocked(bookingsRepository);
const mockDb = jest.mocked(db);
const mockSendEmail = jest.mocked(sendEmail);

const USER_ID = 'user-uuid-1';
const SESSION_ID = 'session-uuid-1';
const BOOKING_ID = 'booking-uuid-1';

const fakeSession = {
  id: SESSION_ID,
  classId: 'class-uuid',
  date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h from now
  currentCapacity: 0,
  status: ClassSessionStatus.SCHEDULED,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  class: {
    id: 'class-uuid',
    maxCapacity: 10,
    title: 'Pilates',
    isActive: true,
    description: null,
    instructor: 'João',
    dayOfWeek: 'MONDAY' as any,
    startTime: '08:00',
    durationMin: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const fakePlan = { id: 'plan-id', classesPerMonth: 12 };

const fakeSubscription = {
  id: 'sub-id',
  userId: USER_ID,
  status: SubscriptionStatus.ACTIVE,
  classesUsedThisMonth: 5,
  plan: fakePlan,
};

const fakeBooking = {
  id: BOOKING_ID,
  userId: USER_ID,
  classSessionId: SESSION_ID,
  status: BookingStatus.CONFIRMED,
  waitlistPosition: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  classSession: fakeSession,
};

describe('bookingsService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── listByUser ───────────────────────────────────────────────────────────

  describe('listByUser()', () => {
    it('delegates to repository', async () => {
      mockRepo.listByUser.mockResolvedValue([fakeBooking]);
      const result = await bookingsService.listByUser(USER_ID);
      expect(mockRepo.listByUser).toHaveBeenCalledWith(USER_ID);
      expect(result).toHaveLength(1);
    });
  });

  // ─── getById ──────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('returns booking when found', async () => {
      mockRepo.findById.mockResolvedValue(fakeBooking);
      const result = await bookingsService.getById(BOOKING_ID);
      expect(result).toEqual(fakeBooking);
    });

    it('throws NotFoundError when booking does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(bookingsService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── book ─────────────────────────────────────────────────────────────────

  describe('book()', () => {
    beforeEach(() => {
      mockDb.subscription.findFirst.mockResolvedValue(fakeSubscription as any);
      mockDb.classSession.findUnique.mockResolvedValue(fakeSession as any);
      mockRepo.findByUserAndSession.mockResolvedValue(null);
      mockRepo.countConfirmedForSession.mockResolvedValue(5);
    });

    it('creates a confirmed booking when session has space and user has credits', async () => {
      mockRepo.create.mockResolvedValue(fakeBooking);
      mockDb.subscription.update.mockResolvedValue({} as any);

      const result = await bookingsService.book({ userId: USER_ID, classSessionId: SESSION_ID });
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { classesUsedThisMonth: { increment: 1 } } }),
      );
    });

    it('creates waitlist booking when session is full', async () => {
      mockRepo.countConfirmedForSession.mockResolvedValue(10); // at capacity
      const waitlisted = { ...fakeBooking, status: BookingStatus.WAITLIST };
      mockRepo.create.mockResolvedValue(waitlisted);

      const result = await bookingsService.book({ userId: USER_ID, classSessionId: SESSION_ID });
      expect(result.status).toBe(BookingStatus.WAITLIST);
    });

    it('throws ForbiddenError when user has no active subscription', async () => {
      mockDb.subscription.findFirst.mockResolvedValue(null);
      await expect(bookingsService.book({ userId: USER_ID, classSessionId: SESSION_ID })).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when session does not exist', async () => {
      mockDb.classSession.findUnique.mockResolvedValue(null);
      await expect(bookingsService.book({ userId: USER_ID, classSessionId: SESSION_ID })).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when user already has a booking for this session', async () => {
      mockRepo.findByUserAndSession.mockResolvedValue(fakeBooking);
      await expect(bookingsService.book({ userId: USER_ID, classSessionId: SESSION_ID })).rejects.toThrow(ConflictError);
    });

    it('throws ForbiddenError when monthly class limit is reached', async () => {
      mockDb.subscription.findFirst.mockResolvedValue({
        ...fakeSubscription,
        classesUsedThisMonth: 12,
        plan: { ...fakePlan, classesPerMonth: 12 },
      } as any);
      await expect(bookingsService.book({ userId: USER_ID, classSessionId: SESSION_ID })).rejects.toThrow(ForbiddenError);
    });

    it('does not deduct credits for unlimited plans (>=999 classes)', async () => {
      mockDb.subscription.findFirst.mockResolvedValue({
        ...fakeSubscription,
        classesUsedThisMonth: 50,
        plan: { ...fakePlan, classesPerMonth: 999 },
      } as any);
      mockRepo.create.mockResolvedValue(fakeBooking);

      await bookingsService.book({ userId: USER_ID, classSessionId: SESSION_ID });
      expect(mockDb.subscription.update).not.toHaveBeenCalled();
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────────

  describe('cancel()', () => {
    it('cancels a confirmed booking and restores credit when > 24h before class', async () => {
      mockRepo.findById.mockResolvedValue(fakeBooking); // session date 48h away
      mockRepo.updateStatus.mockResolvedValue({ ...fakeBooking, status: BookingStatus.CANCELED });
      mockRepo.firstWaitlistForSession.mockResolvedValue(null);
      mockDb.subscription.findFirst.mockResolvedValue(fakeSubscription as any);
      mockDb.subscription.update.mockResolvedValue({} as any);

      await bookingsService.cancel(BOOKING_ID, USER_ID);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(BOOKING_ID, BookingStatus.CANCELED);
      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { classesUsedThisMonth: { decrement: 1 } } }),
      );
    });

    it('cancels booking but does NOT restore credit when within 24h window', async () => {
      const soonSession = { ...fakeSession, date: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2h away
      mockRepo.findById.mockResolvedValue({ ...fakeBooking, classSession: soonSession });
      mockRepo.updateStatus.mockResolvedValue({ ...fakeBooking, status: BookingStatus.CANCELED });
      mockRepo.firstWaitlistForSession.mockResolvedValue(null);

      await bookingsService.cancel(BOOKING_ID, USER_ID);

      expect(mockDb.subscription.update).not.toHaveBeenCalled();
    });

    it('promotes waitlisted user and sends email when a confirmed booking is cancelled', async () => {
      const waitlistedBooking = { ...fakeBooking, id: 'waitlist-booking-id', userId: 'other-user', status: BookingStatus.WAITLIST };
      mockRepo.findById.mockResolvedValue(fakeBooking);
      mockRepo.updateStatus.mockResolvedValue({ ...fakeBooking, status: BookingStatus.CANCELED });
      mockRepo.firstWaitlistForSession.mockResolvedValue(waitlistedBooking as any);
      mockDb.user.findUnique.mockResolvedValue({ email: 'other@email.com', name: 'Other User' } as any);
      mockDb.subscription.findFirst.mockResolvedValue(fakeSubscription as any);
      mockDb.subscription.update.mockResolvedValue({} as any);

      await bookingsService.cancel(BOOKING_ID, USER_ID);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('waitlist-booking-id', BookingStatus.CONFIRMED);
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('promotes waitlisted user but skips email when user record is missing', async () => {
      const waitlistedBooking = { ...fakeBooking, id: 'waitlist-booking-id', userId: 'missing-user', status: BookingStatus.WAITLIST };
      mockRepo.findById.mockResolvedValue(fakeBooking);
      mockRepo.updateStatus.mockResolvedValue({ ...fakeBooking, status: BookingStatus.CANCELED });
      mockRepo.firstWaitlistForSession.mockResolvedValue(waitlistedBooking as any);
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.subscription.findFirst.mockResolvedValue(fakeSubscription as any);
      mockDb.subscription.update.mockResolvedValue({} as any);

      await bookingsService.cancel(BOOKING_ID, USER_ID);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('waitlist-booking-id', BookingStatus.CONFIRMED);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when booking does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(bookingsService.cancel(BOOKING_ID, USER_ID)).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user cancels another user\'s booking', async () => {
      mockRepo.findById.mockResolvedValue({ ...fakeBooking, userId: 'different-user' });
      await expect(bookingsService.cancel(BOOKING_ID, USER_ID)).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError when booking is already cancelled', async () => {
      mockRepo.findById.mockResolvedValue({ ...fakeBooking, status: BookingStatus.CANCELED });
      await expect(bookingsService.cancel(BOOKING_ID, USER_ID)).rejects.toThrow(ConflictError);
    });

    it('does not restore credit for waitlist cancellation', async () => {
      const waitlistBooking = { ...fakeBooking, status: BookingStatus.WAITLIST };
      mockRepo.findById.mockResolvedValue(waitlistBooking);
      mockRepo.updateStatus.mockResolvedValue({ ...waitlistBooking, status: BookingStatus.CANCELED });
      mockRepo.firstWaitlistForSession.mockResolvedValue(null);

      await bookingsService.cancel(BOOKING_ID, USER_ID);
      expect(mockDb.subscription.update).not.toHaveBeenCalled();
    });

    it('does not restore credit for unlimited plans on confirmed cancellation', async () => {
      mockRepo.findById.mockResolvedValue(fakeBooking);
      mockRepo.updateStatus.mockResolvedValue({ ...fakeBooking, status: BookingStatus.CANCELED });
      mockRepo.firstWaitlistForSession.mockResolvedValue(null);
      mockDb.subscription.findFirst.mockResolvedValue({
        ...fakeSubscription,
        plan: { ...fakePlan, classesPerMonth: 999 },
      } as any);

      await bookingsService.cancel(BOOKING_ID, USER_ID);

      expect(mockDb.subscription.update).not.toHaveBeenCalled();
    });
  });
});
