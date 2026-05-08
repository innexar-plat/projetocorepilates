import { postsRepository } from '../repositories/posts.repository';
import { NotFoundError, ConflictError } from '@/lib/errors';
import type { CreatePostDto, UpdatePostDto, ListPostsDto } from '../dtos/post.dto';

export const postsService = {
  async list(dto: ListPostsDto) {
    return postsRepository.findAll(dto);
  },

  async listPublished(page: number, limit: number) {
    const [items, total] = await Promise.all([
      postsRepository.findPublished(page, limit),
      postsRepository.countPublished(),
    ]);
    return { items, total };
  },

  async getBySlug(slug: string) {
    const post = await postsRepository.findBySlug(slug);
    if (!post) throw new NotFoundError('Post not found');
    return post;
  },

  async getById(id: string) {
    const post = await postsRepository.findById(id);
    if (!post) throw new NotFoundError('Post not found');
    return post;
  },

  async create(authorId: string, dto: CreatePostDto) {
    const existing = await postsRepository.slugExists(dto.slug);
    if (existing) throw new ConflictError('Slug already in use');
    return postsRepository.create(authorId, dto);
  },

  async update(id: string, dto: UpdatePostDto) {
    await postsService.getById(id);
    if (dto.slug) {
      const conflict = await postsRepository.slugExists(dto.slug, id);
      if (conflict) throw new ConflictError('Slug already in use');
    }
    return postsRepository.update(id, dto);
  },

  async delete(id: string) {
    await postsService.getById(id);
    return postsRepository.delete(id);
  },
};
