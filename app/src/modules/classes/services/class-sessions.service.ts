import { classSessionsRepository, type CreateSessionDto, type UpdateSessionDto } from '../repositories/class-sessions.repository';
import { classesService } from './classes.service';
import { NotFoundError, ConflictError } from '@/lib/errors';

/**
 * Generates all dates for a given weekday within [startDate, endDate].
 * weekday: 0=Sunday … 6=Saturday (JS convention)
 */
function getDatesForWeekday(weekday: number, startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  // Advance to the first occurrence of that weekday
  while (current.getDay() !== weekday) {
    current.setDate(current.getDate() + 1);
  }
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const classSessionsService = {
  async listUpcoming(classId?: string, limit = 30) {
    return classSessionsRepository.listUpcoming(classId, limit);
  },

  async getById(id: string) {
    const session = await classSessionsRepository.findById(id);
    if (!session) throw new NotFoundError('Class session not found');
    return session;
  },

  async create(dto: CreateSessionDto) {
    // Ensure the class exists
    await classesService.getById(dto.classId);
    const date = new Date(dto.date);
    return classSessionsRepository.create({ classId: dto.classId, date, notes: dto.notes });
  },

  async update(id: string, dto: UpdateSessionDto) {
    await classSessionsService.getById(id);
    return classSessionsRepository.update(id, dto);
  },

  /**
   * Generates all sessions for a class within a date range by repeating
   * on the class's configured dayOfWeek. Returns the number of sessions created.
   *
   * Example: class on MONDAY from 2026-04-01 to 2026-06-30 → ~13 sessions created.
   */
  async generateSchedule(classId: string, fromDate: string, toDate: string) {
    const cls = await classesService.getById(classId);
    if (!cls.isActive) throw new ConflictError('Cannot generate schedule for inactive class');

    const weekday = DAY_MAP[cls.dayOfWeek];
    if (weekday === undefined) throw new ConflictError('Class has invalid dayOfWeek');

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (start >= end) throw new ConflictError('fromDate must be before toDate');

    const dates = getDatesForWeekday(weekday, start, end);
    const created = await classSessionsRepository.bulkCreate(classId, dates);
    return { created, total: dates.length, classId };
  },
};
