import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { classSessionsService } from '@/modules/classes/services/class-sessions.service';
import { db } from '@/lib/db';
import { createSessionSchema } from '@/modules/classes/repositories/class-sessions.repository';
import { apiCreated, apiError, apiSuccess } from '@/lib/api';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const generateSchema = z.object({
  classId: z.string().uuid(),
  fromDate: z.string().date(),
  toDate: z.string().date(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  classId: z.string().min(1).optional(),
  status: z.string().optional(),
});

/**
 * GET /api/v1/admin/sessions
 * Paginated list of all class sessions (past and future). Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = req.nextUrl;
    const { page, limit, classId, status } = listQuerySchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      classId: searchParams.get('classId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    const where = {
      ...(classId ? { classId } : {}),
      ...(status ? { status: status as any } : {}),
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.classSession.findMany({
        where,
        skip,
        take: limit,
        include: {
          class: { select: { id: true, title: true, instructor: true, maxCapacity: true, startTime: true, dayOfWeek: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: { date: 'desc' },
      }),
      db.classSession.count({ where }),
    ]);

    return apiSuccess({
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return apiError(err);
  }
}

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
