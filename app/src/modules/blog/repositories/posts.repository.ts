import { db } from '@/lib/db';
import type { CreatePostDto, UpdatePostDto, ListPostsDto } from '../dtos/post.dto';
import type { PostStatus } from '@prisma/client';

const POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverUrl: true,
  status: true,
  publishedAt: true,
  metaTitle: true,
  metaDesc: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
} as const;

const POST_SELECT_FULL = {
  ...POST_SELECT,
  content: true,
} as const;

export const postsRepository = {
  async findAll({ page, limit, status, search }: ListPostsDto) {
    const where = {
      ...(status ? { status: status as PostStatus } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { excerpt: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: POST_SELECT,
      }),
      db.post.count({ where }),
    ]);

    return { items, total };
  },

  findPublished(page: number, limit: number) {
    return db.post.findMany({
      where: { status: 'PUBLISHED' },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: POST_SELECT,
    });
  },

  countPublished() {
    return db.post.count({ where: { status: 'PUBLISHED' } });
  },

  findBySlug(slug: string) {
    return db.post.findUnique({
      where: { slug },
      select: POST_SELECT_FULL,
    });
  },

  findById(id: string) {
    return db.post.findUnique({
      where: { id },
      select: POST_SELECT_FULL,
    });
  },

  create(authorId: string, data: CreatePostDto) {
    return db.post.create({
      data: {
        ...data,
        authorId,
        coverUrl: data.coverUrl || null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      },
      select: POST_SELECT_FULL,
    });
  },

  update(id: string, data: UpdatePostDto) {
    return db.post.update({
      where: { id },
      data: {
        ...data,
        coverUrl: data.coverUrl !== undefined ? (data.coverUrl || null) : undefined,
        publishedAt: data.publishedAt !== undefined
          ? (data.publishedAt ? new Date(data.publishedAt) : null)
          : undefined,
      },
      select: POST_SELECT_FULL,
    });
  },

  delete(id: string) {
    return db.post.delete({ where: { id } });
  },

  slugExists(slug: string, excludeId?: string) {
    return db.post.findFirst({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
  },
};
