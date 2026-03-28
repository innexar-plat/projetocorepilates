import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { usersService } from '@/modules/users/services/users.service';
import { updateUserSchema } from '@/modules/users/dtos/user.dto';
import { apiSuccess, apiClientError, handleApiError } from '@/lib/api';

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) return apiClientError(401, 'Unauthorized', 'Authentication required');

    const user = await usersService.getById(userId);

    return apiSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return apiClientError(401, 'Unauthorized', 'Authentication required');

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return apiClientError(400, 'Bad Request', 'Validation failed', parsed.error.issues);
    }

    const updated = await usersService.update(userId, parsed.data);

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
