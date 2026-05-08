import { postsService } from '../services/posts.service';
import { postsRepository } from '../repositories/posts.repository';
import { NotFoundError, ConflictError } from '@/lib/errors';

jest.mock('../repositories/posts.repository');

const mockRepo = jest.mocked(postsRepository);

const fakePost: any = {
  id: 'post-uuid-1',
  title: 'My Post',
  slug: 'my-post',
  excerpt: 'excerpt',
  content: 'body',
  coverUrl: null,
  status: 'DRAFT',
  publishedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  author: { id: 'user-1', name: 'Author', avatarUrl: null },
};

describe('postsService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ─────────────────────────────────────────────────────────────────────
  describe('list()', () => {
    it('delegates to repository findAll', async () => {
      mockRepo.findAll.mockResolvedValue({ items: [fakePost], total: 1 });
      const result = await postsService.list({ page: 1, limit: 10 });
      expect(mockRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
    });
  });

  // ── listPublished ─────────────────────────────────────────────────────────────
  describe('listPublished()', () => {
    it('returns combined items + total', async () => {
      mockRepo.findPublished.mockResolvedValue([fakePost]);
      mockRepo.countPublished.mockResolvedValue(1);
      const result = await postsService.listPublished(1, 10);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ── getBySlug ─────────────────────────────────────────────────────────────────
  describe('getBySlug()', () => {
    it('returns the post when found', async () => {
      mockRepo.findBySlug.mockResolvedValue(fakePost);
      const result = await postsService.getBySlug('my-post');
      expect(result).toEqual(fakePost);
    });

    it('throws NotFoundError when slug does not exist', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);
      await expect(postsService.getBySlug('nope')).rejects.toThrow(NotFoundError);
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────────
  describe('getById()', () => {
    it('returns the post when found', async () => {
      mockRepo.findById.mockResolvedValue(fakePost);
      const result = await postsService.getById('post-uuid-1');
      expect(result).toEqual(fakePost);
    });

    it('throws NotFoundError when id does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(postsService.getById('missing')).rejects.toThrow(NotFoundError);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto = {
      title: 'New Post',
      slug: 'new-post',
      content: 'content',
      status: 'DRAFT' as const,
    };

    it('creates a post when slug is free', async () => {
      mockRepo.slugExists.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(fakePost);
      const result = await postsService.create('user-1', dto);
      expect(mockRepo.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(fakePost);
    });

    it('throws ConflictError when slug is already in use', async () => {
      mockRepo.slugExists.mockResolvedValue({ id: 'other-post' } as any);
      await expect(postsService.create('user-1', dto)).rejects.toThrow(ConflictError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  // ── update ────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('updates when post exists and slug is free', async () => {
      mockRepo.findById.mockResolvedValue(fakePost);
      mockRepo.slugExists.mockResolvedValue(null);
      const updated = { ...fakePost, title: 'Updated' };
      mockRepo.update.mockResolvedValue(updated);
      const result = await postsService.update('post-uuid-1', { title: 'Updated', slug: 'new-slug' });
      expect(mockRepo.update).toHaveBeenCalledWith('post-uuid-1', { title: 'Updated', slug: 'new-slug' });
      expect(result.title).toBe('Updated');
    });

    it('throws NotFoundError when post does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(postsService.update('missing', { title: 'X' })).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when updated slug conflicts with another post', async () => {
      mockRepo.findById.mockResolvedValue(fakePost);
      mockRepo.slugExists.mockResolvedValue({ id: 'another-post' } as any);
      await expect(postsService.update('post-uuid-1', { slug: 'taken-slug' })).rejects.toThrow(ConflictError);
    });

    it('updates without checking slug conflict when slug is absent', async () => {
      mockRepo.findById.mockResolvedValue(fakePost);
      const updated = { ...fakePost, excerpt: 'new excerpt' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await postsService.update('post-uuid-1', { excerpt: 'new excerpt' });

      expect(mockRepo.slugExists).not.toHaveBeenCalled();
      expect(mockRepo.update).toHaveBeenCalledWith('post-uuid-1', { excerpt: 'new excerpt' });
      expect(result.excerpt).toBe('new excerpt');
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('deletes when post exists', async () => {
      mockRepo.findById.mockResolvedValue(fakePost);
      mockRepo.delete.mockResolvedValue(fakePost);
      await postsService.delete('post-uuid-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('post-uuid-1');
    });

    it('throws NotFoundError when post does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(postsService.delete('missing')).rejects.toThrow(NotFoundError);
    });
  });
});
