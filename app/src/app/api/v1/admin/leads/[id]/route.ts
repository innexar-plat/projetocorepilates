import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { leadsService } from '@/modules/leads/services/leads.service';
import { updateLeadSchema } from '@/modules/leads/dtos/lead.dto';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/leads/[id]
 * Returns a single lead by ID. Admin only.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const lead = await leadsService.getById(params.id);
    return apiSuccess({ data: lead });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH /api/v1/admin/leads/[id]
 * Updates lead status or notes. Admin only.
 *
 * Body: { status?, notes? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const dto = updateLeadSchema.parse(body);
    const lead = await leadsService.update(params.id, dto);
    return apiSuccess({ data: lead });
  } catch (err) {
    return apiError(err);
  }
}
