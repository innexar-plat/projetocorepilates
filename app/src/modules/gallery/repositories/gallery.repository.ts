import { db } from '@/lib/db';
import type {
  CreateGalleryImageDto,
  UpdateGalleryImageDto,
  CreateGalleryAlbumDto,
  UpdateGalleryAlbumDto,
} from '../dtos/gallery.dto';

const SELECT = {
  id: true,
  title: true,
  album: true,
  url: true,
  altText: true,
  order: true,
  isActive: true,
  createdAt: true,
} as const;

const ALBUM_SELECT = {
  id: true,
  name: true,
  description: true,
  order: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const galleryRepository = {
  findAll(onlyActive = false, album?: string) {
    const albumFilter = album?.trim();

    return db.galleryImage.findMany({
      where: {
        ...(onlyActive ? { isActive: true } : {}),
        ...(albumFilter ? { album: albumFilter } : {}),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: SELECT,
    });
  },

  findById(id: string) {
    return db.galleryImage.findUnique({ where: { id }, select: SELECT });
  },

  create(data: CreateGalleryImageDto) {
    return db.galleryImage.create({ data, select: SELECT });
  },

  update(id: string, data: UpdateGalleryImageDto) {
    return db.galleryImage.update({ where: { id }, data, select: SELECT });
  },

  delete(id: string) {
    return db.galleryImage.delete({ where: { id } });
  },

  findAllAlbums() {
    return db.galleryAlbum.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: ALBUM_SELECT,
    });
  },

  findAlbumById(id: string) {
    return db.galleryAlbum.findUnique({ where: { id }, select: ALBUM_SELECT });
  },

  findAlbumByName(name: string) {
    const normalizedName = name.trim();
    if (!normalizedName) return Promise.resolve(null);

    return db.galleryAlbum.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      select: ALBUM_SELECT,
    });
  },

  createAlbum(data: CreateGalleryAlbumDto) {
    return db.galleryAlbum.create({ data, select: ALBUM_SELECT });
  },

  updateAlbum(id: string, data: UpdateGalleryAlbumDto) {
    return db.galleryAlbum.update({ where: { id }, data, select: ALBUM_SELECT });
  },

  async deleteAlbum(id: string) {
    const album = await db.galleryAlbum.findUnique({ where: { id } });
    if (!album) return null;

    await db.$transaction([
      db.galleryImage.updateMany({ where: { album: album.name }, data: { album: null } }),
      db.galleryAlbum.delete({ where: { id } }),
    ]);

    return album;
  },
};
