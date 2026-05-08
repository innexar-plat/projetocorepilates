import { apiError, apiSuccess } from '@/lib/api';
import { galleryService } from '@/modules/gallery/services/gallery.service';

/**
 * GET /api/v1/gallery/albums
 * Returns active gallery albums ordered for public filtering.
 */
export async function GET() {
  try {
    const albums = await galleryService.listAlbums();
    const activeAlbums = albums.filter((item) => item.isActive);
    return apiSuccess(activeAlbums);
  } catch (err) {
    return apiError(err);
  }
}
