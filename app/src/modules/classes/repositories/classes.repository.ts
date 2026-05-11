import { db } from '@/lib/db';
import type { CreateClassDto, UpdateClassDto } from '../dtos/class.dto';

function isUnknownImageUrlFieldError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('Unknown argument `imageUrl`') ||
    error.message.includes('Unknown field `imageUrl`')
  );
}

function normalizeImageUrl<T extends { imageUrl?: string }>(data: T): T {
  if (typeof data.imageUrl === 'string' && data.imageUrl.trim() === '') {
    const { imageUrl: _imageUrl, ...rest } = data;
    return rest as T;
  }
  return data;
}

export const classesRepository = {
  findAll(onlyActive = false) {
    return db.class.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  findById(id: string) {
    return db.class.findUnique({
      where: { id },
    });
  },

  create(data: CreateClassDto) {
    const normalizedData = normalizeImageUrl(data);
    return db.class.create({ data: normalizedData });
  },

  async update(id: string, data: UpdateClassDto) {
    const normalizedData = normalizeImageUrl(data);

    try {
      return await db.class.update({ where: { id }, data: normalizedData });
    } catch (error) {
      // Temporary runtime safety: if Prisma Client was not restarted after schema change,
      // retry without imageUrl to avoid returning HTTP 500 for other editable fields.
      if (isUnknownImageUrlFieldError(error) && 'imageUrl' in normalizedData) {
        const { imageUrl: _imageUrl, ...withoutImageUrl } = normalizedData;
        return db.class.update({ where: { id }, data: withoutImageUrl });
      }
      throw error;
    }
  },

  async updateImageByTitle(title: string, imageUrl?: string) {
    const normalizedTitle = title.trim();
    const normalizedImageUrl = typeof imageUrl === 'string' && imageUrl.trim() !== ''
      ? imageUrl.trim()
      : null;

    try {
      return await db.class.updateMany({
        where: { title: normalizedTitle },
        data: { imageUrl: normalizedImageUrl },
      });
    } catch (error) {
      // Temporary runtime safety for stale Prisma Client in dev sessions.
      if (isUnknownImageUrlFieldError(error)) {
        const affectedRows = await db.$executeRaw`
          UPDATE "classes"
          SET "imageUrl" = ${normalizedImageUrl},
              "updatedAt" = NOW()
          WHERE "title" = ${normalizedTitle}
        `;

        return { count: Number(affectedRows) };
      }

      throw error;
    }
  },
};
