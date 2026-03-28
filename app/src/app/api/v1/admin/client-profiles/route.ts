import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { clientProfilesService } from '@/modules/client-profiles/services/client-profiles.service';
import { apiPaginated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/v1/admin/client-profiles
 * Lists client profiles that are incomplete (pending follow-up). Admin only.
 * Query: ?page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = req.nextUrl;
    const { page, limit } = querySchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const result = await clientProfilesService.listIncomplete(page, limit);
    return apiPaginated(result, result.length, page, limit);
  } catch (err) {
    return apiError(err);
  }
}
