import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole, BookingStatus } from '@prisma/client';

/**
 * GET /api/v1/admin/bookings
 * Paginated list of all bookings. Admin only.
 *
 * Query params:
 *  - page (default 1)
 *  - limit (default 20, max 100)
 *  - userId - filter by user UUID
 *  - classSessionId - filter by class session UUID
 *  - status - filter by BookingStatus
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const userId = searchParams.get('userId') ?? undefined;
    const classSessionId = searchParams.get('classSessionId') ?? undefined;
    const rawStatus = searchParams.get('status');
    const status =
      rawStatus && Object.values(BookingStatus).includes(rawStatus as BookingStatus)
        ? (rawStatus as BookingStatus)
        : undefined;

    const where = {
      ...(userId ? { userId } : {}),
      ...(classSessionId ? { classSessionId } : {}),
      ...(status ? { status } : {}),
    };

    const [bookings, total] = await db.$transaction([
      db.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          classSession: {
            include: { class: { select: { id: true, title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.booking.count({ where }),
    ]);

    return apiSuccess({
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
