import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { clientProfilesService } from '@/modules/client-profiles/services/client-profiles.service';
import { apiPaginated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['all', 'incomplete', 'complete']).default('all'),
});

/**
 * GET /api/v1/admin/client-profiles
 * Lists client profiles with optional status filter. Admin only.
 * Query: ?page=1&limit=20&status=all|incomplete|complete
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = req.nextUrl;
    const { page, limit, status } = querySchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    const result = await clientProfilesService.list(page, limit, status);
    return apiPaginated(result.items, result.total, page, limit);
  } catch (err) {
    return apiError(err);
  }
}
