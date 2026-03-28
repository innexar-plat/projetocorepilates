import { db } from '@/lib/db';
import { classSessionsRepository } from '../repositories/class-sessions.repository';
import { ClassSessionStatus } from '@prisma/client';

const mockDb = jest.mocked(db);

const baseSession: any = {
  id: 'session-uuid-1',
  classId: 'class-uuid-1',
  date: new Date('2026-03-01'),
  status: ClassSessionStatus.SCHEDULED,
  currentCapacity: 0,
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  class: {
    id: 'class-uuid-1',
    title: 'Pilates',
    instructor: 'Ana',
    maxCapacity: 10,
    durationMin: 60,
    startTime: '08:00',
  },
};

describe('classSessionsRepository', () => {
  // ── listUpcoming ─────────────────────────────────────────────────────────────
  describe('listUpcoming', () => {
    it('returns upcoming scheduled sessions without classId filter', async () => {
      mockDb.classSession.findMany.mockResolvedValue([baseSession]);
      const result = await classSessionsRepository.listUpcoming();
      expect(mockDb.classSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ClassSessionStatus.SCHEDULED }),
        }),
      );
      expect(result).toEqual([baseSession]);
    });

    it('filters by classId when provided', async () => {
      mockDb.classSession.findMany.mockResolvedValue([baseSession]);
      await classSessionsRepository.listUpcoming('class-uuid-1', 5);
      expect(mockDb.classSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ classId: 'class-uuid-1' }),
          take: 5,
        }),
      );
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.classSession.findUnique with id', async () => {
      mockDb.classSession.findUnique.mockResolvedValue(baseSession);
      const result = await classSessionsRepository.findById('session-uuid-1');
      expect(mockDb.classSession.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'session-uuid-1' } }),
      );
      expect(result).toEqual(baseSession);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.classSession.create with classId and date', async () => {
      mockDb.classSession.create.mockResolvedValue(baseSession);
      const date = new Date('2026-03-01');
      const result = await classSessionsRepository.create({
        classId: 'class-uuid-1',
        date,
        notes: 'test',
      });
      expect(mockDb.classSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { classId: 'class-uuid-1', date, notes: 'test' },
        }),
      );
      expect(result).toEqual(baseSession);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls db.classSession.update with id and data', async () => {
      const updated = { ...baseSession, status: ClassSessionStatus.CANCELED };
      mockDb.classSession.update.mockResolvedValue(updated);
      const result = await classSessionsRepository.update('session-uuid-1', {
        status: ClassSessionStatus.CANCELED,
      });
      expect(mockDb.classSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-uuid-1' },
          data: { status: ClassSessionStatus.CANCELED },
        }),
      );
      expect(result).toEqual(updated);
    });
  });

  // ── bulkCreate ───────────────────────────────────────────────────────────────
  describe('bulkCreate', () => {
    it('calls db.classSession.createMany and returns count of created sessions', async () => {
      mockDb.classSession.createMany.mockResolvedValue({ count: 3 });
      const dates = [
        new Date('2026-03-01'),
        new Date('2026-03-08'),
        new Date('2026-03-15'),
      ];
      const result = await classSessionsRepository.bulkCreate('class-uuid-1', dates);
      expect(mockDb.classSession.createMany).toHaveBeenCalledWith({
        data: dates.map((date) => ({ classId: 'class-uuid-1', date })),
        skipDuplicates: true,
      });
      expect(result).toBe(3);
    });
  });
});
