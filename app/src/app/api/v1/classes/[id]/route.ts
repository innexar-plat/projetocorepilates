import { NextRequest } from 'next/server';
import { classesService } from '@/modules/classes/services/classes.service';
import { apiSuccess, apiError } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/classes/:id
 * Returns details for a single pilates class. Public endpoint.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const cls = await classesService.getById(id);
    return apiSuccess({ data: cls });
  } catch (err) {
    return apiError(err);
  }
}
