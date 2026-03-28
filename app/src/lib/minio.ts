import * as Minio from 'minio';
import { storageLogger } from '@/lib/logger';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'core-pilates-media';

export const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? '',
  secretKey: process.env.MINIO_SECRET_KEY ?? '',
});

export interface UploadResult {
  url: string;
  filename: string;
}

export async function uploadImage(
  file: Buffer,
  mimeType: string,
  folder: 'gallery' | 'posts' | 'avatars',
  sizeBytes: number,
): Promise<UploadResult> {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error(`Invalid file type "${mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large (${sizeBytes} bytes). Maximum: ${MAX_FILE_SIZE_BYTES} bytes`);
  }

  const ext = mimeType.split('/')[1];
  const filename = `${folder}/${crypto.randomUUID()}.${ext}`;

  await minio.putObject(MINIO_BUCKET, filename, file, sizeBytes, {
    'Content-Type': mimeType,
  });

  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const host = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = process.env.MINIO_PORT ?? '9000';
  const url = `${protocol}://${host}:${port}/${MINIO_BUCKET}/${filename}`;

  storageLogger.info({ filename, folder, sizeBytes }, 'File uploaded');
  return { url, filename };
}

export async function deleteFile(filename: string): Promise<void> {
  await minio.removeObject(MINIO_BUCKET, filename);
  storageLogger.info({ filename }, 'File deleted');
}

/**
 * Generic file upload — use for non-image assets (contracts, exports, etc.)
 * Caller is responsible for ensuring the content type is appropriate.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string,
  contentType: string,
): Promise<UploadResult> {
  const objectName = `${folder}/${filename}`;

  await minio.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const host = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = process.env.MINIO_PORT ?? '9000';
  const url = `${protocol}://${host}:${port}/${MINIO_BUCKET}/${objectName}`;

  storageLogger.info({ filename: objectName, folder, sizeBytes: buffer.length }, 'File uploaded');
  return { url, filename: objectName };
}
