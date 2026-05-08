import { NextRequest } from 'next/server';
import { galleryService } from '@/modules/gallery/services/gallery.service';
import { apiSuccess, apiError } from '@/lib/api';

/**
 * GET /api/v1/gallery
 * Returns all active gallery images. Public.
 */
export async function GET(req: NextRequest) {
  try {
    const album = req.nextUrl.searchParams.get('album')?.trim() || undefined;
    const normalizedAlbumFilter = album?.toLowerCase();
    const [images, albums] = await Promise.all([
      galleryService.listAll(true, album),
      galleryService.listAlbums(),
    ]);

    const activeAlbums = albums.filter((item) => item.isActive);
    const activeAlbumNames = new Set(activeAlbums.map((item) => item.name.trim().toLowerCase()));
    const albumOrderMap = new Map(activeAlbums.map((item) => [item.name.trim().toLowerCase(), item.order]));

    const filtered = images
      .filter((image) => {
        const normalizedImageAlbum = image.album?.trim().toLowerCase();

        if (!normalizedImageAlbum) return !normalizedAlbumFilter;
        if (!activeAlbumNames.has(normalizedImageAlbum)) return false;
        if (normalizedAlbumFilter) return normalizedImageAlbum === normalizedAlbumFilter;
        return true;
      })
      .sort((a, b) => {
        const normalizedAlbumA = a.album?.trim().toLowerCase();
        const normalizedAlbumB = b.album?.trim().toLowerCase();
        const albumOrderA = normalizedAlbumA ? (albumOrderMap.get(normalizedAlbumA) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
        const albumOrderB = normalizedAlbumB ? (albumOrderMap.get(normalizedAlbumB) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;

        if (albumOrderA !== albumOrderB) return albumOrderA - albumOrderB;
        if (a.order !== b.order) return a.order - b.order;

        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

    return apiSuccess(filtered);
  } catch (err) {
    return apiError(err);
  }
}
