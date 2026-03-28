import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { subscriptionsService } from '@/modules/subscriptions/services/subscriptions.service';
import { apiSuccess, apiClientError, handleApiError } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return apiClientError(401, 'Unauthorized', 'Authentication required');

    const subscription = await subscriptionsService.getActiveByUserId(userId);

    return apiSuccess(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}
