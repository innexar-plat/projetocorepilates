import { NextRequest } from 'next/server';
import { postsService } from '@/modules/blog/services/posts.service';
import { apiSuccess, apiError } from '@/lib/api';

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/v1/blog/:slug
 * Returns a single published post by slug. Public.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const post = await postsService.getBySlug(slug);
    if (post.status !== 'PUBLISHED') return apiError(new Error('Not Found'), 404);
    return apiSuccess({ data: post });
  } catch (err) {
    return apiError(err);
  }
}
