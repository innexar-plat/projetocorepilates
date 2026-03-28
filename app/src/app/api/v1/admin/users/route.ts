import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';
import { listUsersSchema } from '@/modules/users/dtos/user.dto';
import { apiPaginated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/users
 * Lists all users with pagination and search. Admin only.
 *
 * Query params: page, limit, search, sortBy, order
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = req.nextUrl;
    const dto = listUsersSchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      order: searchParams.get('order') ?? undefined,
    });

    const { items, total } = await usersService.list(dto);
    return apiPaginated(items, total, dto.page, dto.limit);
  } catch (err) {
    return apiError(err);
  }
}
