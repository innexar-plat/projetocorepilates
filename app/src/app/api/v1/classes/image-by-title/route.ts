import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api';
import { classesService } from '@/modules/classes/services/classes.service';
import { updateClassImageByTitleSchema } from '@/modules/classes/dtos/class.dto';

/**
 * PATCH /api/v1/classes/image-by-title
 * Updates class photo for all classes with the same title. Admin only.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const body = await req.json();
    const dto = updateClassImageByTitleSchema.parse(body);
    const result = await classesService.updateImageByTitle(dto.title, dto.imageUrl);

    return apiSuccess({ data: { updatedCount: result.count } });
  } catch (error) {
    return apiError(error);
  }
}
