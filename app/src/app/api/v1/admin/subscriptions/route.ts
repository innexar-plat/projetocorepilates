import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiPaginated, apiError } from '@/lib/api';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});

/**
 * GET /api/v1/admin/subscriptions
 * Lists all subscriptions with user and plan info. Admin only.
 * Query: ?page=1&limit=20&status=ACTIVE
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = req.nextUrl;
    const { page, limit, status } = querySchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [items, total] = await Promise.all([
      db.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.subscription.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (err) {
    return apiError(err);
  }
}
