import * as Minio from 'minio';
import { storageLogger } from '@/lib/logger';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'core-pilates-media';
let ensureBucketPromise: Promise<void> | null = null;

const INTERNAL_MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

function getPublicMinioBaseUrl(): string {
  const useSSL =
    (process.env.MINIO_PUBLIC_USE_SSL ?? process.env.MINIO_USE_SSL ?? 'false') === 'true';
  const protocol = useSSL ? 'https' : 'http';
  const host =
    process.env.MINIO_PUBLIC_ENDPOINT ??
    process.env.MINIO_ENDPOINT ??
    'localhost';
  const port = process.env.MINIO_PUBLIC_PORT ?? process.env.MINIO_PORT ?? '9000';
  return `${protocol}://${host}:${port}`;
}

export const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
  useSSL: INTERNAL_MINIO_USE_SSL,
  accessKey: process.env.MINIO_ACCESS_KEY ?? '',
  secretKey: process.env.MINIO_SECRET_KEY ?? '',
});

async function ensureBucketExists(): Promise<void> {
  if (!ensureBucketPromise) {
    ensureBucketPromise = (async () => {
      const exists = await minio.bucketExists(MINIO_BUCKET);
      if (!exists) {
        await minio.makeBucket(MINIO_BUCKET);
        storageLogger.warn({ bucket: MINIO_BUCKET }, 'MinIO bucket created automatically');
      }
    })().catch((error) => {
      // Allow retry on next upload attempt if bucket check/create fails.
      ensureBucketPromise = null;
      throw error;
    });
  }

  await ensureBucketPromise;
}

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

  await ensureBucketExists();

  await minio.putObject(MINIO_BUCKET, filename, file, sizeBytes, {
    'Content-Type': mimeType,
  });

  const url = `${getPublicMinioBaseUrl()}/${MINIO_BUCKET}/${filename}`;

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

  await ensureBucketExists();

  await minio.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  const url = `${getPublicMinioBaseUrl()}/${MINIO_BUCKET}/${objectName}`;

  storageLogger.info({ filename: objectName, folder, sizeBytes: buffer.length }, 'File uploaded');
  return { url, filename: objectName };
}
