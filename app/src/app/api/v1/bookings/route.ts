import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { bookingsService } from '@/modules/bookings/services/bookings.service';
import { createBookingSchema } from '@/modules/bookings/dtos/booking.dto';
import { apiSuccess, apiCreated, apiError } from '@/lib/api';

// GET /api/v1/bookings — returns authenticated user's bookings
export async function GET() {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);
    const bookings = await bookingsService.listByUser(session.user.id);
    return apiSuccess({ data: bookings });
  } catch (err) {
    return apiError(err);
  }
}

// POST /api/v1/bookings — book a class session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const dto = createBookingSchema.parse({ ...body, userId: session.user.id });
    const booking = await bookingsService.book(dto);
    return apiCreated({ data: booking });
  } catch (err) {
    return apiError(err);
  }
}
