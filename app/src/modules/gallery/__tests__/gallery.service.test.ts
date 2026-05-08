import { galleryService } from '../services/gallery.service';
import { galleryRepository } from '../repositories/gallery.repository';
import { NotFoundError } from '@/lib/errors';

jest.mock('../repositories/gallery.repository');

const mockRepo = jest.mocked(galleryRepository);

const fakeImage: any = {
  id: 'img-uuid-1',
  title: 'Studio Photo',
  album: 'Studio',
  url: 'https://example.com/photo.jpg',
  altText: 'Studio',
  order: 1,
  isActive: true,
  createdAt: new Date('2026-01-01'),
};

const fakeAlbum: any = {
  id: 'alb-uuid-1',
  name: 'Studio',
  description: 'Main studio shots',
  order: 0,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('galleryService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── listAll ───────────────────────────────────────────────────────────────────
  describe('listAll()', () => {
    it('returns all images when no filter', async () => {
      mockRepo.findAll.mockResolvedValue([fakeImage]);
      const result = await galleryService.listAll();
      expect(mockRepo.findAll).toHaveBeenCalledWith(false, undefined);
      expect(result).toHaveLength(1);
    });

    it('passes onlyActive=true to repository', async () => {
      mockRepo.findAll.mockResolvedValue([fakeImage]);
      await galleryService.listAll(true);
      expect(mockRepo.findAll).toHaveBeenCalledWith(true, undefined);
    });

    it('passes album filter to repository', async () => {
      mockRepo.findAll.mockResolvedValue([fakeImage]);
      await galleryService.listAll(false, 'Studio');
      expect(mockRepo.findAll).toHaveBeenCalledWith(false, 'Studio');
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────────
  describe('getById()', () => {
    it('returns the image when found', async () => {
      mockRepo.findById.mockResolvedValue(fakeImage);
      const result = await galleryService.getById('img-uuid-1');
      expect(result).toEqual(fakeImage);
    });

    it('throws NotFoundError when image does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(galleryService.getById('missing')).rejects.toThrow(NotFoundError);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('delegates creation to repository', async () => {
      const dto = { url: 'https://example.com/new.jpg', order: 2, isActive: true };
      mockRepo.create.mockResolvedValue({ ...fakeImage, ...dto });
      const result = await galleryService.create(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result.url).toBe(dto.url);
    });

    it('trims album and reuses canonical album name when it already exists', async () => {
      mockRepo.findAlbumByName.mockResolvedValue(fakeAlbum);
      mockRepo.create.mockResolvedValue({ ...fakeImage, album: 'Studio' });

      await galleryService.create({
        url: 'https://example.com/new.jpg',
        album: '  Studio  ',
      } as any);

      expect(mockRepo.findAlbumByName).toHaveBeenCalledWith('Studio');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ album: 'Studio' }),
      );
    });

    it('drops blank album values before creating image', async () => {
      mockRepo.create.mockResolvedValue({ ...fakeImage, album: null });

      await galleryService.create({
        url: 'https://example.com/new.jpg',
        album: '   ',
      } as any);

      expect(mockRepo.findAlbumByName).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ album: undefined }),
      );
    });
  });

  // ── update ────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('updates when image exists', async () => {
      mockRepo.findById.mockResolvedValue(fakeImage);
      const updated = { ...fakeImage, title: 'New Title' };
      mockRepo.update.mockResolvedValue(updated);
      const result = await galleryService.update('img-uuid-1', { title: 'New Title' });
      expect(mockRepo.update).toHaveBeenCalledWith('img-uuid-1', { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });

    it('throws NotFoundError when image does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(galleryService.update('missing', { title: 'X' })).rejects.toThrow(NotFoundError);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('sets album to null when album field is provided as blank', async () => {
      mockRepo.findById.mockResolvedValue(fakeImage);
      mockRepo.update.mockResolvedValue({ ...fakeImage, album: null });

      await galleryService.update('img-uuid-1', { album: '   ' } as any);

      expect(mockRepo.update).toHaveBeenCalledWith('img-uuid-1', {
        album: null,
      });
    });

    it('resolves and applies trimmed album name when album does not exist', async () => {
      mockRepo.findById.mockResolvedValue(fakeImage);
      mockRepo.findAlbumByName.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue({ ...fakeImage, album: 'New Album' });

      await galleryService.update('img-uuid-1', { album: '  New Album  ' } as any);

      expect(mockRepo.findAlbumByName).toHaveBeenCalledWith('New Album');
      expect(mockRepo.update).toHaveBeenCalledWith('img-uuid-1', {
        album: 'New Album',
      });
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('deletes when image exists', async () => {
      mockRepo.findById.mockResolvedValue(fakeImage);
      mockRepo.delete.mockResolvedValue(fakeImage);
      await galleryService.delete('img-uuid-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('img-uuid-1');
    });

    it('throws NotFoundError when image does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(galleryService.delete('missing')).rejects.toThrow(NotFoundError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('album CRUD', () => {
    it('lists albums', async () => {
      mockRepo.findAllAlbums.mockResolvedValue([fakeAlbum]);
      const result = await galleryService.listAlbums();
      expect(mockRepo.findAllAlbums).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('creates album', async () => {
      mockRepo.createAlbum.mockResolvedValue(fakeAlbum);
      const result = await galleryService.createAlbum({ name: 'Studio' });
      expect(mockRepo.createAlbum).toHaveBeenCalledWith({ name: 'Studio' });
      expect(result.name).toBe('Studio');
    });

    it('throws when deleting unknown album', async () => {
      mockRepo.deleteAlbum.mockResolvedValue(null);
      await expect(galleryService.deleteAlbum('missing')).rejects.toThrow(NotFoundError);
    });

    it('returns album on successful delete', async () => {
      mockRepo.deleteAlbum.mockResolvedValue(fakeAlbum);

      const result = await galleryService.deleteAlbum('alb-uuid-1');

      expect(result).toEqual(fakeAlbum);
    });

    it('throws when album is not found by id', async () => {
      mockRepo.findAlbumById.mockResolvedValue(null);

      await expect(galleryService.getAlbumById('missing')).rejects.toThrow(NotFoundError);
    });
  });
});
