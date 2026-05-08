import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { classesService } from '@/modules/classes/services/classes.service';
import { createClassSchema } from '@/modules/classes/dtos/class.dto';
import { apiSuccess, apiCreated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

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
    return apiError(error);
  }
}

/**
 * POST /api/v1/classes
 * Creates a new pilates class. Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const dto = createClassSchema.parse(body);
    const cls = await classesService.create(dto);
    return apiCreated({ data: cls });
  } catch (err) {
    return apiError(err);
  }
}
