import { db } from '@/lib/db';
import { parsePagination } from '@/lib/api';
import { z } from 'zod';

export const listPaymentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPaymentsDto = z.infer<typeof listPaymentsSchema>;

export const paymentsRepository = {
  async listByUser(userId: string, dto: ListPaymentsDto) {
    const { skip, take } = parsePagination(dto);
    const [data, total] = await Promise.all([
      db.payment.findMany({
        where: { userId },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          stripePaymentIntentId: true,
          stripeInvoiceId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.payment.count({ where: { userId } }),
    ]);
    return { data, total };
  },

  create(data: {
    userId: string;
    amount: number;
    currency?: string; // defaults to 'usd'
    status: string;
    description?: string;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
  }) {
    return db.payment.create({ data: data as any });
  },
};
