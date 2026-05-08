import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { plansService } from '@/modules/plans/services/plans.service';
import { UserRole } from '@prisma/client';

/**
 * POST /api/v1/admin/plans/sync-stripe
 * Synchronizes active plans with Stripe products/prices and persists IDs.
 * Admin only.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const result = await plansService.syncActivePlansWithStripe();
    return apiSuccess(result);
  } catch (err) {
    return apiError(err);
  }
}
