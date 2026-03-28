import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { leadsService } from '@/modules/leads/services/leads.service';
import { listLeadsSchema } from '@/modules/leads/dtos/lead.dto';
import { apiPaginated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/leads
 * Paginated list of all leads. Admin only.
 *
 * Query params:
 *  - page (default 1)
 *  - limit (default 20, max 100)
 *  - status - filter by LeadStatus
 *  - search - partial match on name or email
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = new URL(req.url);
    const dto = listLeadsSchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    const { data, total } = await leadsService.list(dto);
    return apiPaginated(data, total, dto.page, dto.limit);
  } catch (err) {
    return apiError(err);
  }
}
