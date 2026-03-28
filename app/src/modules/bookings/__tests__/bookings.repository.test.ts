import { db } from '@/lib/db';
import { bookingsRepository } from '../repositories/bookings.repository';
import { BookingStatus } from '@prisma/client';

const mockDb = jest.mocked(db);

const baseBooking = {
  id: 'booking-uuid-1',
  userId: 'user-uuid-1',
  classSessionId: 'session-uuid-1',
  waitlistPosition: null,
  status: BookingStatus.CONFIRMED,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('bookingsRepository', () => {
  // ── findById ────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.booking.findUnique with id', async () => {
      mockDb.booking.findUnique.mockResolvedValue(baseBooking);
      const result = await bookingsRepository.findById('booking-uuid-1');
      expect(mockDb.booking.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'booking-uuid-1' } }),
      );
      expect(result).toEqual(baseBooking);
    });
  });

  // ── findByUserAndSession ────────────────────────────────────────────────────
  describe('findByUserAndSession', () => {
    it('calls db.booking.findFirst with userId and classSessionId', async () => {
      mockDb.booking.findFirst.mockResolvedValue(baseBooking);
      const result = await bookingsRepository.findByUserAndSession('user-uuid-1', 'session-uuid-1');
      expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-uuid-1', classSessionId: 'session-uuid-1' }),
        }),
      );
      expect(result).toEqual(baseBooking);
    });
  });

  // ── listByUser ──────────────────────────────────────────────────────────────
  describe('listByUser', () => {
    it('calls db.booking.findMany with userId', async () => {
      mockDb.booking.findMany.mockResolvedValue([baseBooking]);
      const result = await bookingsRepository.listByUser('user-uuid-1');
      expect(mockDb.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid-1' } }),
      );
      expect(result).toEqual([baseBooking]);
    });
  });

  // ── countConfirmedForSession ────────────────────────────────────────────────
  describe('countConfirmedForSession', () => {
    it('counts confirmed bookings for a session', async () => {
      mockDb.booking.count.mockResolvedValue(5);
      const result = await bookingsRepository.countConfirmedForSession('session-uuid-1');
      expect(mockDb.booking.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { classSessionId: 'session-uuid-1', status: BookingStatus.CONFIRMED },
        }),
      );
      expect(result).toBe(5);
    });
  });

  // ── firstWaitlistForSession ─────────────────────────────────────────────────
  describe('firstWaitlistForSession', () => {
    it('queries for first WAITLIST booking ordered by createdAt', async () => {
      const waitlistBooking = { ...baseBooking, status: BookingStatus.WAITLIST };
      mockDb.booking.findFirst.mockResolvedValue(waitlistBooking);
      const result = await bookingsRepository.firstWaitlistForSession('session-uuid-1');
      expect(mockDb.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { classSessionId: 'session-uuid-1', status: 'WAITLIST' },
        }),
      );
      expect(result).toEqual(waitlistBooking);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.booking.create with userId, classSessionId, and status', async () => {
      mockDb.booking.create.mockResolvedValue(baseBooking);
      const data = { userId: 'user-uuid-1', classSessionId: 'session-uuid-1', status: BookingStatus.CONFIRMED };
      const result = await bookingsRepository.create(data);
      expect(mockDb.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({ data }),
      );
      expect(result).toEqual(baseBooking);
    });
  });

  // ── updateStatus ────────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('calls db.booking.update with id and new status', async () => {
      const updated = { ...baseBooking, status: BookingStatus.CANCELED };
      mockDb.booking.update.mockResolvedValue(updated);
      const result = await bookingsRepository.updateStatus('booking-uuid-1', BookingStatus.CANCELED);
      expect(mockDb.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-uuid-1' },
          data: { status: BookingStatus.CANCELED },
        }),
      );
      expect(result).toEqual(updated);
    });
  });
});
