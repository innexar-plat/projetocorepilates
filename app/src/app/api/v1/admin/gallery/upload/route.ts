import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiCreated, apiError } from '@/lib/api';
import { uploadImage } from '@/lib/minio';
import { galleryService } from '@/modules/gallery/services/gallery.service';

const MAX_UPLOAD_FILES = 30;

function parseIntOrDefault(value: FormDataEntryValue | null, defaultValue: number): number {
  if (!value || typeof value !== 'string') return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : defaultValue;
}

function parseBooleanOrDefault(value: FormDataEntryValue | null, defaultValue: boolean): boolean {
  if (!value || typeof value !== 'string') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return defaultValue;
}

function extractTitleFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * POST /api/v1/admin/gallery/upload
 * Uploads one or many gallery images to MinIO and persists records.
 * Content-Type: multipart/form-data
 * Fields:
 * - files: File[] (or single file)
 * - title?: string (used as base title)
 * - altText?: string
 * - order?: number (base order)
 * - isActive?: boolean
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const formData = await req.formData();
    const files = formData
      .getAll('files')
      .filter((entry): entry is File => typeof entry !== 'string');

    if (files.length === 0) {
      return apiError(new Error('No image files provided'), 400);
    }

    if (files.length > MAX_UPLOAD_FILES) {
      return apiError(new Error(`Maximum ${MAX_UPLOAD_FILES} files per upload`), 400);
    }

    const baseTitleEntry = formData.get('title');
    const baseTitle =
      typeof baseTitleEntry === 'string' && baseTitleEntry.trim().length > 0
        ? baseTitleEntry.trim().slice(0, 100)
        : undefined;

    const altTextEntry = formData.get('altText');
    const altText =
      typeof altTextEntry === 'string' && altTextEntry.trim().length > 0
        ? altTextEntry.trim().slice(0, 200)
        : undefined;

    const albumEntry = formData.get('album');
    const album =
      typeof albumEntry === 'string' && albumEntry.trim().length > 0
        ? albumEntry.trim().slice(0, 80)
        : undefined;

    const initialOrder = parseIntOrDefault(formData.get('order'), 0);
    const isActive = parseBooleanOrDefault(formData.get('isActive'), true);

    const created = [] as Awaited<ReturnType<typeof galleryService.create>>[];
    const failed: Array<{ name: string; reason: string }> = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { url } = await uploadImage(buffer, file.type, 'gallery', buffer.byteLength);

        const fallbackTitle = extractTitleFromFilename(file.name);
        const title =
          baseTitle && files.length > 1
            ? `${baseTitle} ${index + 1}`
            : (baseTitle ?? fallbackTitle) || undefined;

        const image = await galleryService.create({
          url,
          title,
          album,
          altText,
          order: initialOrder + index,
          isActive,
        });

        created.push(image);
      } catch (error) {
        failed.push({
          name: file.name,
          reason: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    if (created.length === 0) {
      const firstFailureReason = failed[0]?.reason;
      const failureSummary = firstFailureReason
        ? `No image could be uploaded: ${firstFailureReason}`
        : 'No image could be uploaded';
      return apiError(new Error(failureSummary), 400);
    }

    return apiCreated({ data: { created, failed } });
  } catch (err) {
    return apiError(err);
  }
}
