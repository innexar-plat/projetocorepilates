import { auth } from '@/lib/auth';
import { contractsService } from '@/modules/contracts/services/contracts.service';
import { apiSuccess, apiError } from '@/lib/api';

/**
 * GET /api/v1/contracts
 * Returns the authenticated user's contract (content + signature status).
 * The client reads this before signing.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const contract = await contractsService.getByUserId(session.user.id);
    return apiSuccess({ data: contract });
  } catch (err) {
    return apiError(err);
  }
}
