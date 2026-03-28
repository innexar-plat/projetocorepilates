import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { bookingsService } from '@/modules/bookings/services/bookings.service';
import { apiSuccess, apiError } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

// DELETE /api/v1/bookings/:id — cancel booking
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const booking = await bookingsService.cancel(id, session.user.id);
    return apiSuccess({ data: booking });
  } catch (err) {
    return apiError(err);
  }
}
