import { httpGet, httpPost } from '@/services/http-client';

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isPromotion?: boolean;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
  classesPerMonth: number;
};

export type PilatesClass = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  durationMin: number;
  maxCapacity: number;
};

export type WebsitePost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  author?: { id: string; name: string; avatarUrl?: string | null };
};

export type WebsiteGalleryImage = {
  id: string;
  title?: string | null;
  album?: string | null;
  url: string;
  altText?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
};

export type WebsiteGalleryAlbum = {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadDto = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  source?: string;
};

export const websiteService = {
  async listPlans(): Promise<Plan[]> {
    const { data } = await httpGet<Plan[]>('/api/v1/plans');
    return data;
  },

  async listClasses(): Promise<PilatesClass[]> {
    const { data } = await httpGet<PilatesClass[]>('/api/v1/classes');
    return data;
  },

  async listPosts(page = 1, limit = 20): Promise<WebsitePost[]> {
    const { data } = await httpGet<WebsitePost[]>(`/api/v1/blog?page=${page}&limit=${limit}`);
    return data;
  },

  async listGalleryImages(album?: string): Promise<WebsiteGalleryImage[]> {
    const qs = new URLSearchParams();
    if (album) qs.set('album', album);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const { data } = await httpGet<WebsiteGalleryImage[]>(`/api/v1/gallery${suffix}`);
    return data;
  },

  async listGalleryAlbums(): Promise<WebsiteGalleryAlbum[]> {
    const { data } = await httpGet<WebsiteGalleryAlbum[]>('/api/v1/gallery/albums');
    return data;
  },

  async createLead(payload: CreateLeadDto): Promise<{ id: string }> {
    return httpPost<{ id: string }, CreateLeadDto>('/api/v1/leads', payload);
  },
};
