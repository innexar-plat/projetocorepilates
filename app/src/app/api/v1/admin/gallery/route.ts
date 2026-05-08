import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { galleryService } from '@/modules/gallery/services/gallery.service';
import { createGalleryImageSchema } from '@/modules/gallery/dtos/gallery.dto';
import { apiSuccess, apiCreated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/gallery
 * Lists all gallery images (including inactive). Admin only.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const album = _req.nextUrl.searchParams.get('album')?.trim() || undefined;
    const images = await galleryService.listAll(false, album);
    return apiSuccess(images);
  } catch (err) {
    return apiError(err);
  }
}

/**
 * POST /api/v1/admin/gallery
 * Adds a new gallery image. Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const body = await req.json();
    const dto = createGalleryImageSchema.parse(body);
    const image = await galleryService.create(dto);
    return apiCreated({ data: image });
  } catch (err) {
    return apiError(err);
  }
}
