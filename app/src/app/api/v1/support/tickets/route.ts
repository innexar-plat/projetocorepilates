import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { supportService } from '@/modules/support/services/support.service';
import { createTicketSchema, replyTicketSchema, updateTicketStatusSchema } from '@/modules/support/dtos/ticket.dto';
import { apiSuccess, apiCreated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

// GET /api/v1/support/tickets
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const isAdmin = session.user.role === UserRole.ADMIN;
    if (isAdmin) {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, Number(searchParams.get('page') ?? 1));
      const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
      const status = searchParams.get('status') ?? undefined;
      const result = await supportService.listAll(page, limit, status);
      return apiSuccess(result);
    }

    const tickets = await supportService.listByUser(session.user.id);
    return apiSuccess({ data: tickets });
  } catch (err) {
    return apiError(err);
  }
}

// POST /api/v1/support/tickets
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const dto = createTicketSchema.parse(body);
    const ticket = await supportService.create(session.user.id, dto);
    return apiCreated({ data: ticket });
  } catch (err) {
    return apiError(err);
  }
}
