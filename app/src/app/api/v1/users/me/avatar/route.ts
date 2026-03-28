import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';
import { uploadImage } from '@/lib/minio';
import { apiSuccess, apiError } from '@/lib/api';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

/**
 * POST /api/v1/users/me/avatar
 * Uploads a new avatar image for the authenticated user.
 * Content-Type: multipart/form-data — field name: "avatar"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const formData = await req.formData();
    const file = formData.get('avatar');

    if (!file || typeof file === 'string') {
      return apiError(new Error('No avatar file provided'), 400);
    }

    const mimeType = file.type as AllowedType;
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return apiError(
        new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`),
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength > MAX_AVATAR_BYTES) {
      return apiError(new Error('Avatar must be smaller than 5 MB'), 400);
    }

    const { url } = await uploadImage(buffer, mimeType, 'avatars', buffer.byteLength);
    const updated = await usersService.update(session.user.id, { avatarUrl: url });

    return apiSuccess({ data: { avatarUrl: updated.avatarUrl } });
  } catch (err) {
    return apiError(err);
  }
}
