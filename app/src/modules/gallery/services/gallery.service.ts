import { galleryRepository } from '../repositories/gallery.repository';
import { NotFoundError } from '@/lib/errors';
import type {
  CreateGalleryImageDto,
  UpdateGalleryImageDto,
  CreateGalleryAlbumDto,
  UpdateGalleryAlbumDto,
} from '../dtos/gallery.dto';

async function resolveAlbumName(album: string | null | undefined): Promise<string | undefined> {
  const normalized = album?.trim();
  if (!normalized) return undefined;

  const existingAlbum = await galleryRepository.findAlbumByName(normalized);
  if (existingAlbum) return existingAlbum.name;

  return normalized;
}

export const galleryService = {
  listAll(onlyActive = false, album?: string) {
    return galleryRepository.findAll(onlyActive, album);
  },

  async getById(id: string) {
    const image = await galleryRepository.findById(id);
    if (!image) throw new NotFoundError('Gallery image not found');
    return image;
  },

  create(dto: CreateGalleryImageDto) {
    return resolveAlbumName(dto.album).then((albumName) =>
      galleryRepository.create({
        ...dto,
        album: albumName,
      }),
    );
  },

  async update(id: string, dto: UpdateGalleryImageDto) {
    await galleryService.getById(id);

    const hasAlbumField = Object.prototype.hasOwnProperty.call(dto, 'album');
    const albumName = hasAlbumField ? await resolveAlbumName(dto.album) : undefined;

    return galleryRepository.update(id, {
      ...dto,
      ...(hasAlbumField ? { album: albumName ?? null } : {}),
    });
  },

  async delete(id: string) {
    await galleryService.getById(id);
    return galleryRepository.delete(id);
  },

  listAlbums() {
    return galleryRepository.findAllAlbums();
  },

  async getAlbumById(id: string) {
    const album = await galleryRepository.findAlbumById(id);
    if (!album) throw new NotFoundError('Gallery album not found');
    return album;
  },

  createAlbum(dto: CreateGalleryAlbumDto) {
    return galleryRepository.createAlbum(dto);
  },

  async updateAlbum(id: string, dto: UpdateGalleryAlbumDto) {
    await galleryService.getAlbumById(id);
    return galleryRepository.updateAlbum(id, dto);
  },

  async deleteAlbum(id: string) {
    const removed = await galleryRepository.deleteAlbum(id);
    if (!removed) throw new NotFoundError('Gallery album not found');
    return removed;
  },
};
