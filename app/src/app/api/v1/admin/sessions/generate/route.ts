import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { classSessionsService } from '@/modules/classes/services/class-sessions.service';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const generateSchema = z.object({
  classId: z.string().uuid(),
  fromDate: z.string().date('Must be YYYY-MM-DD'),
  toDate: z.string().date('Must be YYYY-MM-DD'),
});

/**
 * POST /api/v1/admin/sessions/generate
 * Bulk-generates recurring sessions for a class within a date range.
 * Uses the class's dayOfWeek to calculate session dates (skips duplicates).
 * Admin only.
 *
 * Example: POST { classId, fromDate: "2026-04-01", toDate: "2026-06-30" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const { classId, fromDate, toDate } = generateSchema.parse(body);
    const result = await classSessionsService.generateSchedule(classId, fromDate, toDate);
    return apiSuccess({ data: result });
  } catch (err) {
    return apiError(err);
  }
}
