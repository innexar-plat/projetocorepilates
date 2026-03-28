import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { supportService } from '@/modules/support/services/support.service';
import { replyTicketSchema, updateTicketStatusSchema } from '@/modules/support/dtos/ticket.dto';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const isAdmin = session.user.role === UserRole.ADMIN;
    const ticket = isAdmin
      ? await supportService.getById(id)
      : await supportService.getByIdForUser(id, session.user.id);

    return apiSuccess({ data: ticket });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id } = await params;
    const body = await req.json();
    const dto = replyTicketSchema.parse(body);
    const isAdmin = session.user.role === UserRole.ADMIN;
    const message = await supportService.reply(id, session.user.id, dto, isAdmin);
    return apiSuccess({ data: message });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { id } = await params;
    const body = await req.json();
    const dto = updateTicketStatusSchema.parse(body);
    const ticket = await supportService.updateStatus(id, dto);
    return apiSuccess({ data: ticket });
  } catch (err) {
    return apiError(err);
  }
}
