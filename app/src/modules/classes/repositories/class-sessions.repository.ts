import { z } from 'zod';
import { db } from '@/lib/db';
import { ClassSessionStatus } from '@prisma/client';

export const createSessionSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().date('Date must be YYYY-MM-DD'),
  notes: z.string().max(500).optional(),
});

export const updateSessionSchema = z.object({
  status: z.nativeEnum(ClassSessionStatus).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;

export const classSessionsRepository = {
  /**
   * Upcoming sessions from today onwards, optionally filtered by classId.
   * Includes class name, capacity info, and booking count.
   */
  async listUpcoming(classId?: string, limit = 30) {
    return db.classSession.findMany({
      where: {
        date: { gte: new Date() },
        status: ClassSessionStatus.SCHEDULED,
        ...(classId ? { classId } : {}),
      },
      include: {
        class: {
          select: { id: true, title: true, instructor: true, maxCapacity: true, durationMin: true, startTime: true },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  },

  findById(id: string) {
    return db.classSession.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, title: true, instructor: true, maxCapacity: true, durationMin: true, startTime: true } },
        _count: { select: { bookings: true } },
      },
    });
  },

  create(data: { classId: string; date: Date; notes?: string }) {
    return db.classSession.create({
      data,
      include: {
        class: { select: { id: true, title: true, instructor: true, maxCapacity: true, durationMin: true, startTime: true } },
      },
    });
  },

  update(id: string, data: UpdateSessionDto) {
    return db.classSession.update({
      where: { id },
      data,
      include: {
        class: { select: { id: true, title: true, instructor: true, maxCapacity: true, durationMin: true, startTime: true } },
      },
    });
  },

  /**
   * Bulk-create sessions for a class within a date range.
   * Skips existing sessions (idempotent).
   */
  async bulkCreate(classId: string, dates: Date[]): Promise<number> {
    const result = await db.classSession.createMany({
      data: dates.map((date) => ({ classId, date })),
      skipDuplicates: true,
    });
    return result.count;
  },
};
