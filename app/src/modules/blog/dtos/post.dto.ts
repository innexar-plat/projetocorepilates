import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverUrl: z.string().url().max(500).optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  slug: z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only')
    .optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  coverUrl: z.string().url().max(500).optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
});

export const listPostsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;
export type ListPostsDto = z.infer<typeof listPostsSchema>;
