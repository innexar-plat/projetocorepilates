import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiCreated, apiError, apiSuccess } from '@/lib/api';
import { galleryService } from '@/modules/gallery/services/gallery.service';
import { createGalleryAlbumSchema } from '@/modules/gallery/dtos/gallery.dto';

/**
 * GET /api/v1/admin/gallery/albums
 * Lists gallery albums. Admin only.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const albums = await galleryService.listAlbums();
    return apiSuccess({ data: albums });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * POST /api/v1/admin/gallery/albums
 * Creates a new album. Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const dto = createGalleryAlbumSchema.parse(body);
    const album = await galleryService.createAlbum(dto);
    return apiCreated({ data: album });
  } catch (err) {
    return apiError(err);
  }
}
