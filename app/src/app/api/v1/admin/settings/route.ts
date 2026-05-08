import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { settingsService } from '@/modules/settings/services/settings.service';
import { bulkUpsertSettingsSchema } from '@/modules/settings/dtos/settings.dto';
import { apiSuccess, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

/**
 * GET /api/v1/admin/settings
 * Returns all site settings (optionally filtered by group). Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const group = req.nextUrl.searchParams.get('group') ?? undefined;
    const settings = await settingsService.getAll(group);
    return apiSuccess(settings);
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH /api/v1/admin/settings
 * Bulk upserts settings. Admin only.
 * Body: { settings: [{ key, value, group }] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }
    const body = await req.json();
    const dto = bulkUpsertSettingsSchema.parse(body);
    const result = await settingsService.bulkUpsert(dto);
    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}
