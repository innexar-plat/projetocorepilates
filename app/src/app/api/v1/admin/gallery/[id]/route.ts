import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { galleryService } from '@/modules/gallery/services/gallery.service';
import { updateGalleryImageSchema } from '@/modules/gallery/dtos/gallery.dto';
import { apiSuccess, apiNoContent, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/v1/admin/gallery/:id
 * Updates a gallery image. Admin only.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const { id } = await params;
    const body = await req.json();
    const dto = updateGalleryImageSchema.parse(body);
    const image = await galleryService.update(id, dto);
    return apiSuccess({ data: image });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/admin/gallery/:id
 * Permanently deletes a gallery image. Admin only.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const { id } = await params;
    await galleryService.delete(id);
    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
