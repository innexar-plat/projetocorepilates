import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { classSessionsService } from '@/modules/classes/services/class-sessions.service';
import { createSessionSchema } from '@/modules/classes/repositories/class-sessions.repository';
import { apiCreated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const generateSchema = z.object({
  classId: z.string().uuid(),
  fromDate: z.string().date(),
  toDate: z.string().date(),
});

/**
 * POST /api/v1/admin/sessions
 * Creates a single class session. Admin only.
 * For bulk schedule generation use POST /api/v1/admin/sessions/generate.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const dto = createSessionSchema.parse(body);
    const created = await classSessionsService.create(dto);
    return apiCreated({ data: created });
  } catch (err) {
    return apiError(err);
  }
}
