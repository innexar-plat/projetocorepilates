import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { postsService } from '@/modules/blog/services/posts.service';
import { updatePostSchema } from '@/modules/blog/dtos/post.dto';
import { apiSuccess, apiNoContent, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/admin/blog/:id
 * Returns a single post by ID. Admin only.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const { id } = await params;
    const post = await postsService.getById(id);
    return apiSuccess({ data: post });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH /api/v1/admin/blog/:id
 * Updates a post. Admin only.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const { id } = await params;
    const body = await req.json();
    const dto = updatePostSchema.parse(body);
    const post = await postsService.update(id, dto);
    return apiSuccess({ data: post });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/admin/blog/:id
 * Permanently deletes a post. Admin only.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const { id } = await params;
    await postsService.delete(id);
    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
