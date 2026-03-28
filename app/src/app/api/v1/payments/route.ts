import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentsService } from '@/modules/payments/services/payments.service';
import { listPaymentsSchema } from '@/modules/payments/repositories/payments.repository';
import { apiSuccess, apiClientError, handleApiError } from '@/lib/api';

/**
 * GET /api/v1/payments
 * Returns paginated payment history for the authenticated user.
 * Query: ?page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return apiClientError(401, 'Unauthorized', 'Authentication required');

    const { searchParams } = req.nextUrl;
    const parsed = listPaymentsSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!parsed.success) {
      return apiClientError(400, 'Bad Request', 'Invalid pagination parameters');
    }

    const result = await paymentsService.listByUser(userId, parsed.data);

    const { page, limit } = parsed.data;
    return apiSuccess(result.data, 200, {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
