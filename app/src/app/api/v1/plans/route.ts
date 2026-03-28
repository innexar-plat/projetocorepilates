import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { plansService } from '@/modules/plans/services/plans.service';
import { createPlanSchema } from '@/modules/plans/dtos/plan.dto';
import { apiSuccess, apiCreated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';

// GET /api/v1/plans — public
export async function GET() {
  try {
    const plans = await plansService.listAll(true);
    return apiSuccess({ data: plans });
  } catch (err) {
    return apiError(err);
  }
}

// POST /api/v1/plans — admin only
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await req.json();
    const dto = createPlanSchema.parse(body);
    const plan = await plansService.create(dto);
    return apiCreated({ data: plan });
  } catch (err) {
    return apiError(err);
  }
}
