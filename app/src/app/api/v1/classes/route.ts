import { NextRequest } from 'next/server';
import { classesService } from '@/modules/classes/services/classes.service';
import { apiSuccess, handleApiError } from '@/lib/api';

/**
 * GET /api/v1/classes
 * Public endpoint — returns all active pilates classes.
 * Query: ?all=true includes inactive classes (admin use).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const onlyActive = searchParams.get('all') !== 'true';

    const classes = await classesService.listAll(onlyActive);

    return apiSuccess(classes);
  } catch (error) {
    return handleApiError(error);
  }
}
