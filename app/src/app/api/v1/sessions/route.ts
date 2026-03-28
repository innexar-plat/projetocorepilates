import { NextRequest } from 'next/server';
import { classSessionsService } from '@/modules/classes/services/class-sessions.service';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const querySchema = z.object({
  classId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/**
 * GET /api/v1/sessions
 * Public — lists upcoming scheduled class sessions.
 * Query: ?classId=uuid&limit=30
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { classId, limit } = querySchema.parse({
      classId: searchParams.get('classId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const sessions = await classSessionsService.listUpcoming(classId, limit);
    return apiSuccess({ data: sessions });
  } catch (err) {
    return apiError(err);
  }
}
