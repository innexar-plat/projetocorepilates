import { z } from 'zod';

export const createGalleryImageSchema = z.object({
  title: z.string().max(100).optional(),
  album: z.string().max(80).optional(),
  url: z.string().url().max(500),
  altText: z.string().max(200).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateGalleryImageSchema = z.object({
  title: z.string().max(100).optional(),
  album: z.string().max(80).optional(),
  url: z.string().url().max(500).optional(),
  altText: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateGalleryImageDto = z.input<typeof createGalleryImageSchema>;
export type UpdateGalleryImageDto = z.input<typeof updateGalleryImageSchema>;

export const createGalleryAlbumSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(200).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateGalleryAlbumSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateGalleryAlbumDto = z.input<typeof createGalleryAlbumSchema>;
export type UpdateGalleryAlbumDto = z.input<typeof updateGalleryAlbumSchema>;
