import { NextRequest } from 'next/server';
import { postsService } from '@/modules/blog/services/posts.service';
import { apiSuccess, apiError } from '@/lib/api';

/**
 * GET /api/v1/blog
 * Returns paginated published blog posts. Public.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const { items, total } = await postsService.listPublished(page, limit);
    return apiSuccess(items, 200, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return apiError(err);
  }
}
