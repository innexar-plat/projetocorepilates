import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';
import { updatePlanSchema } from '@/modules/plans/dtos/plan.dto';
import { apiSuccess, apiNoContent, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const plan = await plansService.getById(id);
    return apiSuccess({ data: plan });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { id } = await params;
    const body = await req.json();
    const dto = updatePlanSchema.parse(body);
    const plan = await plansService.update(id, dto);
    return apiSuccess({ data: plan });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { id } = await params;
    await plansService.deactivate(id);
    return apiNoContent();
  } catch (err) {
    return apiError(err);
  }
}
