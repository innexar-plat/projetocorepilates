import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/bookings/[id]
 * Returns a single booking by ID with full user and session detail. Admin only.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const booking = await db.booking.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        classSession: {
          include: {
            class: { select: { id: true, title: true, instructor: true, durationMin: true, startTime: true } },
          },
        },
      },
    });

    if (!booking) return apiError(new Error('Booking not found'), 404);
    return apiSuccess({ data: booking });
  } catch (err) {
    return apiError(err);
  }
}
