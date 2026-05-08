import { db } from '@/lib/db';
import { galleryRepository } from '../repositories/gallery.repository';

const mockDb = db as any;

const baseImage: any = {
  id: 'img-uuid-1',
  title: 'Studio Photo',
  album: 'Studio',
  url: 'https://example.com/photo.jpg',
  altText: 'Studio',
  order: 1,
  isActive: true,
  createdAt: new Date('2026-01-01'),
};

const baseAlbum: any = {
  id: 'alb-uuid-1',
  name: 'Studio',
  description: 'Main studio shots',
  order: 0,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('galleryRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns all images by default (no active filter)', async () => {
      mockDb.galleryImage.findMany.mockResolvedValue([baseImage]);
      const result = await galleryRepository.findAll();
      expect(mockDb.galleryImage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result).toHaveLength(1);
    });

    it('filters by isActive when onlyActive is true', async () => {
      mockDb.galleryImage.findMany.mockResolvedValue([baseImage]);
      await galleryRepository.findAll(true);
      expect(mockDb.galleryImage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('filters by album when provided', async () => {
      mockDb.galleryImage.findMany.mockResolvedValue([baseImage]);
      await galleryRepository.findAll(false, 'Studio');
      expect(mockDb.galleryImage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { album: 'Studio' } }),
      );
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls findUnique with id', async () => {
      mockDb.galleryImage.findUnique.mockResolvedValue(baseImage);
      const result = await galleryRepository.findById('img-uuid-1');
      expect(mockDb.galleryImage.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'img-uuid-1' } }),
      );
      expect(result).toEqual(baseImage);
    });

    it('returns null when image does not exist', async () => {
      mockDb.galleryImage.findUnique.mockResolvedValue(null);
      const result = await galleryRepository.findById('missing');
      expect(result).toBeNull();
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('delegates to db.galleryImage.create', async () => {
      const dto = { url: 'https://example.com/new.jpg', order: 2, isActive: true };
      mockDb.galleryImage.create.mockResolvedValue({ ...baseImage, ...dto });
      const result = await galleryRepository.create(dto);
      expect(mockDb.galleryImage.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: dto }),
      );
      expect(result.url).toBe(dto.url);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls db.galleryImage.update with id and data', async () => {
      const patch = { title: 'Updated Title' };
      mockDb.galleryImage.update.mockResolvedValue({ ...baseImage, ...patch });
      const result = await galleryRepository.update('img-uuid-1', patch);
      expect(mockDb.galleryImage.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'img-uuid-1' }, data: patch }),
      );
      expect(result.title).toBe('Updated Title');
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('calls db.galleryImage.delete with id', async () => {
      mockDb.galleryImage.delete.mockResolvedValue(baseImage);
      await galleryRepository.delete('img-uuid-1');
      expect(mockDb.galleryImage.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'img-uuid-1' } }),
      );
    });
  });

  describe('albums', () => {
    it('lists albums ordered by order then name', async () => {
      mockDb.galleryAlbum.findMany.mockResolvedValue([baseAlbum]);
      const result = await galleryRepository.findAllAlbums();
      expect(mockDb.galleryAlbum.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
      );
      expect(result).toHaveLength(1);
    });

    it('creates album', async () => {
      mockDb.galleryAlbum.create.mockResolvedValue(baseAlbum);
      const result = await galleryRepository.createAlbum({ name: 'Studio' });
      expect(mockDb.galleryAlbum.create).toHaveBeenCalled();
      expect(result.name).toBe('Studio');
    });

    it('deletes album and clears image album field', async () => {
      mockDb.galleryAlbum.findUnique.mockResolvedValue(baseAlbum);
      mockDb.galleryImage.updateMany.mockResolvedValue({ count: 1 } as any);
      mockDb.galleryAlbum.delete.mockResolvedValue(baseAlbum);
      mockDb.$transaction.mockResolvedValue([{}, {}] as any);

      const result = await galleryRepository.deleteAlbum('alb-uuid-1');

      expect(mockDb.galleryImage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { album: 'Studio' }, data: { album: null } }),
      );
      expect(mockDb.galleryAlbum.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'alb-uuid-1' } }),
      );
      expect(result?.id).toBe('alb-uuid-1');
    });
  });
});
