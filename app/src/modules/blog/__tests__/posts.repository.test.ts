import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { db } from '@/lib/db';
import { postsRepository } from '../repositories/posts.repository';

const mockDb = jest.mocked(db);

const basePost: any = {
  id: 'post-uuid-1',
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'An excerpt',
  content: 'Full content',
  coverUrl: null,
  status: 'DRAFT',
  publishedAt: null,
  metaTitle: null,
  metaDesc: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  author: { id: 'author-1', name: 'Author', avatarUrl: null },
};

describe('postsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns paginated posts without filter', async () => {
      mockDb.post.findMany.mockResolvedValue([basePost]);
      mockDb.post.count.mockResolvedValue(1);

      const result = await postsRepository.findAll({ page: 1, limit: 20 });

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('applies status filter when provided', async () => {
      mockDb.post.findMany.mockResolvedValue([]);
      mockDb.post.count.mockResolvedValue(0);

      await postsRepository.findAll({ page: 1, limit: 20, status: 'PUBLISHED' as any });

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'PUBLISHED' }) }),
      );
    });

    it('applies search filter when provided', async () => {
      mockDb.post.findMany.mockResolvedValue([]);
      mockDb.post.count.mockResolvedValue(0);

      await postsRepository.findAll({ page: 1, limit: 20, search: 'pilates' });

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('offsets correctly for page 2', async () => {
      mockDb.post.findMany.mockResolvedValue([]);
      mockDb.post.count.mockResolvedValue(0);

      await postsRepository.findAll({ page: 2, limit: 10 });

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10 }),
      );
    });
  });

  // ── findPublished ────────────────────────────────────────────────────────────
  describe('findPublished', () => {
    it('queries only PUBLISHED posts', async () => {
      mockDb.post.findMany.mockResolvedValue([basePost]);

      await postsRepository.findPublished(1, 10);

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PUBLISHED' } }),
      );
    });

    it('uses publishedAt desc and pagination params', async () => {
      mockDb.post.findMany.mockResolvedValue([]);

      await postsRepository.findPublished(3, 5);

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
          orderBy: { publishedAt: 'desc' },
        }),
      );
    });
  });

  // ── countPublished ─────────────────────────────────────────────────────────
  describe('countPublished', () => {
    it('counts only PUBLISHED posts', async () => {
      mockDb.post.count.mockResolvedValue(12);

      const total = await postsRepository.countPublished();

      expect(total).toBe(12);
      expect(mockDb.post.count).toHaveBeenCalledWith({ where: { status: 'PUBLISHED' } });
    });
  });

  // ── findBySlug ───────────────────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('calls findUnique with slug', async () => {
      mockDb.post.findUnique.mockResolvedValue(basePost);

      const result = await postsRepository.findBySlug('test-post');

      expect(mockDb.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'test-post' } }),
      );
      expect(result).toEqual(basePost);
    });

    it('returns null when post does not exist', async () => {
      mockDb.post.findUnique.mockResolvedValue(null);
      const result = await postsRepository.findBySlug('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls findUnique with id', async () => {
      mockDb.post.findUnique.mockResolvedValue(basePost);

      const result = await postsRepository.findById('post-uuid-1');

      expect(mockDb.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'post-uuid-1' } }),
      );
      expect(result).toEqual(basePost);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('normalizes optional fields and converts publishedAt to Date', async () => {
      mockDb.post.create.mockResolvedValue(basePost);

      await postsRepository.create('author-1', {
        title: 'New',
        slug: 'new',
        content: 'body',
        status: 'PUBLISHED' as any,
        coverUrl: '',
        publishedAt: '2026-03-01T12:00:00.000Z',
      });

      expect(mockDb.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            authorId: 'author-1',
            coverUrl: null,
            publishedAt: new Date('2026-03-01T12:00:00.000Z'),
          }),
        }),
      );
    });

    it('sets publishedAt to null when not provided', async () => {
      mockDb.post.create.mockResolvedValue(basePost);

      await postsRepository.create('author-1', {
        title: 'Draft post',
        slug: 'draft-post',
        content: 'body',
        status: 'DRAFT' as any,
      });

      expect(mockDb.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: null,
          }),
        }),
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('converts coverUrl empty string and publishedAt empty string to null', async () => {
      mockDb.post.update.mockResolvedValue(basePost);

      await postsRepository.update('post-uuid-1', {
        coverUrl: '',
        publishedAt: '',
      } as any);

      expect(mockDb.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'post-uuid-1' },
          data: expect.objectContaining({
            coverUrl: null,
            publishedAt: null,
          }),
        }),
      );
    });

    it('keeps fields undefined when not provided', async () => {
      mockDb.post.update.mockResolvedValue(basePost);

      await postsRepository.update('post-uuid-1', { title: 'Updated title' });

      expect(mockDb.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Updated title',
            coverUrl: undefined,
            publishedAt: undefined,
          }),
        }),
      );
    });

    it('converts publishedAt string to Date when provided', async () => {
      mockDb.post.update.mockResolvedValue(basePost);

      await postsRepository.update('post-uuid-1', {
        publishedAt: '2026-04-01T10:00:00.000Z',
      });

      expect(mockDb.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: new Date('2026-04-01T10:00:00.000Z'),
          }),
        }),
      );
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('deletes by id', async () => {
      mockDb.post.delete.mockResolvedValue(basePost);

      const result = await postsRepository.delete('post-uuid-1');

      expect(result).toEqual(basePost);
      expect(mockDb.post.delete).toHaveBeenCalledWith({ where: { id: 'post-uuid-1' } });
    });
  });

  // ── slugExists ───────────────────────────────────────────────────────────────
  describe('slugExists', () => {
    it('returns the post record when slug is taken', async () => {
      mockDb.post.findFirst.mockResolvedValue({ id: 'post-uuid-1' } as any);
      const result = await postsRepository.slugExists('test-post');
      expect(result).toBeTruthy();
    });

    it('returns null when slug is free', async () => {
      mockDb.post.findFirst.mockResolvedValue(null);
      const result = await postsRepository.slugExists('free-slug');
      expect(result).toBeNull();
    });

    it('excludes current id when checking for edit conflicts', async () => {
      mockDb.post.findFirst.mockResolvedValue(null);
      await postsRepository.slugExists('test-post', 'post-uuid-1');
      expect(mockDb.post.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ NOT: { id: 'post-uuid-1' } }),
        }),
      );
    });
  });
});
