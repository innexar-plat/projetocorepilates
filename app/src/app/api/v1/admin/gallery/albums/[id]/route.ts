import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiError, apiNoContent, apiSuccess } from '@/lib/api';
import { galleryService } from '@/modules/gallery/services/gallery.service';
import { updateGalleryAlbumSchema } from '@/modules/gallery/dtos/gallery.dto';

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/v1/admin/gallery/albums/:id
 * Updates a gallery album. Admin only.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    const body = await req.json();
    const dto = updateGalleryAlbumSchema.parse(body);
    const album = await galleryService.updateAlbum(id, dto);
    return apiSuccess({ data: album });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * DELETE /api/v1/admin/gallery/albums/:id
 * Deletes a gallery album and clears album field from related images. Admin only.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { id } = await params;
    await galleryService.deleteAlbum(id);
    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
