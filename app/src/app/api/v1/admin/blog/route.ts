import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { postsService } from '@/modules/blog/services/posts.service';
import { createPostSchema, listPostsSchema } from '@/modules/blog/dtos/post.dto';
import { apiSuccess, apiCreated, apiPaginated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/blog
 * Lists all posts with pagination and filters. Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = req.nextUrl;
    const dto = listPostsSchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    const { items, total } = await postsService.list(dto);
    return apiPaginated(items, total, dto.page, dto.limit);
  } catch (err) {
    return apiError(err);
  }
}

/**
 * POST /api/v1/admin/blog
 * Creates a new post. Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const dto = createPostSchema.parse(body);
    const post = await postsService.create(session.user.id, dto);
    return apiCreated({ data: post });
  } catch (err) {
    return apiError(err);
  }
}
