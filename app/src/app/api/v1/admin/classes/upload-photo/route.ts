import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiCreated, apiError } from '@/lib/api';
import { uploadImage } from '@/lib/minio';

export const runtime = 'nodejs';

/**
 * POST /api/v1/admin/classes/upload-photo
 * Uploads one class photo file and returns its public URL.
 * Content-Type: multipart/form-data
 * Fields:
 * - file: File
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const formData = await req.formData();
    const entry = formData.get('file');

    if (!entry || typeof entry === 'string') {
      return apiError(new Error('No image file provided'), 400);
    }

    const arrayBuffer = await entry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { url, filename } = await uploadImage(buffer, entry.type, 'classes', buffer.byteLength);

    return apiCreated({ data: { url, filename } });
  } catch (err) {
    return apiError(err);
  }
}
