import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiSuccess, apiNoContent, apiError } from '@/lib/api';
import { UserRole, BookingStatus } from '@prisma/client';
import { z } from 'zod';

const updateBookingSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

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

/**
 * PATCH /api/v1/admin/bookings/[id]
 * Updates a booking status. Admin only.
 * Body: { status: BookingStatus }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const { status } = updateBookingSchema.parse(body);

    const booking = await db.booking.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        classSession: {
          include: { class: { select: { id: true, title: true } } },
        },
      },
    });

    return apiSuccess({ data: booking });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/admin/bookings/[id]
 * Cancels a booking. Admin only.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    await db.booking.update({
      where: { id: params.id },
      data: { status: BookingStatus.CANCELED },
    });

    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
