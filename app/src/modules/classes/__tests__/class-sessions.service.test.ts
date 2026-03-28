import { classSessionsService } from '../services/class-sessions.service';
import { classSessionsRepository } from '../repositories/class-sessions.repository';
import { classesService } from '../services/classes.service';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { ClassSessionStatus } from '@prisma/client';

jest.mock('../repositories/class-sessions.repository');
jest.mock('../services/classes.service');

const mockRepo = jest.mocked(classSessionsRepository);
const mockClassesService = jest.mocked(classesService);

const CLASS_ID = 'class-uuid-1';
const SESSION_ID = 'session-uuid-1';

const fakeClass = {
  id: CLASS_ID,
  title: 'Pilates Reformer',
  description: 'Aula avançada',
  instructor: 'João Silva',
  maxCapacity: 10,
  durationMin: 60,
  dayOfWeek: 'MONDAY' as const,
  startTime: '08:00',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeSession = {
  id: SESSION_ID,
  classId: CLASS_ID,
  date: new Date('2026-04-07'),
  status: ClassSessionStatus.SCHEDULED,
  currentCapacity: 0,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  class: {
    id: CLASS_ID,
    title: 'Pilates Reformer',
    instructor: 'João Silva',
    maxCapacity: 10,
    durationMin: 60,
    startTime: '08:00',
  },
  _count: { bookings: 0 },
};

describe('classSessionsService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── listUpcoming ────────────────────────────────────────────────────────────

  describe('listUpcoming()', () => {
    it('returns upcoming sessions without filter', async () => {
      mockRepo.listUpcoming.mockResolvedValue([fakeSession] as any);
      const result = await classSessionsService.listUpcoming();
      expect(mockRepo.listUpcoming).toHaveBeenCalledWith(undefined, 30);
      expect(result).toHaveLength(1);
    });

    it('returns upcoming sessions filtered by classId', async () => {
      mockRepo.listUpcoming.mockResolvedValue([fakeSession] as any);
      const result = await classSessionsService.listUpcoming(CLASS_ID, 10);
      expect(mockRepo.listUpcoming).toHaveBeenCalledWith(CLASS_ID, 10);
      expect(result).toHaveLength(1);
    });
  });

  // ─── getById ─────────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('returns the session when found', async () => {
      mockRepo.findById.mockResolvedValue(fakeSession as any);
      const result = await classSessionsService.getById(SESSION_ID);
      expect(result).toEqual(fakeSession);
    });

    it('throws NotFoundError when session does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(classSessionsService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a session after validating the class exists', async () => {
      mockClassesService.getById.mockResolvedValue(fakeClass as any);
      mockRepo.create.mockResolvedValue(fakeSession as any);

      const dto = { classId: CLASS_ID, date: '2026-04-07' };
      const result = await classSessionsService.create(dto);

      expect(mockClassesService.getById).toHaveBeenCalledWith(CLASS_ID);
      expect(mockRepo.create).toHaveBeenCalledWith({
        classId: CLASS_ID,
        date: new Date('2026-04-07'),
        notes: undefined,
      });
      expect(result).toEqual(fakeSession);
    });

    it('propagates NotFoundError if class does not exist', async () => {
      mockClassesService.getById.mockRejectedValue(new NotFoundError('Class not found'));
      await expect(
        classSessionsService.create({ classId: 'bad-id', date: '2026-04-07' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('updates the session when it exists', async () => {
      mockRepo.findById.mockResolvedValue(fakeSession as any);
      const updated = { ...fakeSession, status: ClassSessionStatus.CANCELED };
      mockRepo.update.mockResolvedValue(updated as any);

      const result = await classSessionsService.update(SESSION_ID, {
        status: ClassSessionStatus.CANCELED,
      });
      expect(mockRepo.update).toHaveBeenCalledWith(SESSION_ID, {
        status: ClassSessionStatus.CANCELED,
      });
      expect(result.status).toBe(ClassSessionStatus.CANCELED);
    });

    it('throws NotFoundError when session does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        classSessionsService.update('nonexistent', { notes: 'test' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── generateSchedule ────────────────────────────────────────────────────────

  describe('generateSchedule()', () => {
    it('generates Monday sessions within range', async () => {
      mockClassesService.getById.mockResolvedValue(fakeClass as any); // dayOfWeek: MONDAY
      mockRepo.bulkCreate.mockResolvedValue(4);

      const result = await classSessionsService.generateSchedule(
        CLASS_ID,
        '2026-04-01', // Wednesday
        '2026-04-30', // Thursday
      );

      // 4 weekly occurrences found in range
      expect(mockRepo.bulkCreate).toHaveBeenCalledWith(
        CLASS_ID,
        expect.arrayContaining([expect.any(Date)]),
      );
      expect(result.created).toBe(4);
      expect(result.total).toBe(4);
      expect(result.classId).toBe(CLASS_ID);
    });

    it('throws ConflictError for inactive class', async () => {
      mockClassesService.getById.mockResolvedValue({ ...fakeClass, isActive: false } as any);
      await expect(
        classSessionsService.generateSchedule(CLASS_ID, '2026-04-01', '2026-04-30'),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when fromDate >= toDate', async () => {
      mockClassesService.getById.mockResolvedValue(fakeClass as any);
      await expect(
        classSessionsService.generateSchedule(CLASS_ID, '2026-04-30', '2026-04-01'),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when class dayOfWeek is invalid', async () => {
      mockClassesService.getById.mockResolvedValue({ ...fakeClass, dayOfWeek: 'INVALID_DAY' } as any);
      await expect(
        classSessionsService.generateSchedule(CLASS_ID, '2026-04-01', '2026-04-30'),
      ).rejects.toThrow(ConflictError);
    });

    it('returns zero sessions if no dates match in range', async () => {
      const sundayClass = { ...fakeClass, dayOfWeek: 'SUNDAY' as const };
      mockClassesService.getById.mockResolvedValue(sundayClass as any);
      mockRepo.bulkCreate.mockResolvedValue(0);

      // 5-day range (Tue–Sat UTC) — no Sunday falls within regardless of timezone
      const result = await classSessionsService.generateSchedule(
        CLASS_ID,
        '2026-04-07', // Tuesday UTC
        '2026-04-11', // Saturday UTC
      );
      expect(result.total).toBe(0);
      expect(mockRepo.bulkCreate).toHaveBeenCalledWith(CLASS_ID, []);
    });
  });
});
