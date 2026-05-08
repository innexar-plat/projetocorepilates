import { NextRequest } from 'next/server';
import { classSessionsService } from '@/modules/classes/services/class-sessions.service';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const querySchema = z.object({
  classId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/**
 * GET /api/v1/sessions
 * Public — lists upcoming scheduled class sessions.
 * Query: ?classId=<class-id>&limit=30
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { classId, limit } = querySchema.parse({
      classId: searchParams.get('classId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const sessions = await classSessionsService.listUpcoming(classId, limit);
    const sessionsWithAvailability = sessions.map((session) => {
      const bookedCount = session._count?.bookings ?? 0;
      const maxCapacity = session.class?.maxCapacity ?? 0;
      const availableSlots = Math.max(maxCapacity - bookedCount, 0);

      return {
        ...session,
        bookedCount,
        availableSlots,
        isAvailable: availableSlots > 0,
      };
    });

    return apiSuccess({ data: sessionsWithAvailability });
  } catch (err) {
    return apiError(err);
  }
}
