import { db } from '@/lib/db';
import { parsePagination } from '@/lib/api';
import { z } from 'zod';
import type { PaymentStatus, Prisma } from '@prisma/client';

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
    status: PaymentStatus;
    description?: string;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
  }) {
    return (async () => {
      const paymentData: Prisma.PaymentCreateInput = {
        user: { connect: { id: data.userId } },
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        description: data.description,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeInvoiceId: data.stripeInvoiceId,
      };

      if (data.stripeInvoiceId) {
        const existingByInvoice = await db.payment.findUnique({
          where: { stripeInvoiceId: data.stripeInvoiceId },
        });

        if (existingByInvoice) {
          return db.payment.update({
            where: { stripeInvoiceId: data.stripeInvoiceId },
            data: {
              amount: data.amount,
              currency: data.currency,
              status: data.status,
              description: data.description,
              stripePaymentIntentId: data.stripePaymentIntentId ?? existingByInvoice.stripePaymentIntentId,
            },
          });
        }
      }

      if (data.stripePaymentIntentId) {
        const existingByIntent = await db.payment.findUnique({
          where: { stripePaymentIntentId: data.stripePaymentIntentId },
        });

        if (existingByIntent) {
          return db.payment.update({
            where: { stripePaymentIntentId: data.stripePaymentIntentId },
            data: {
              amount: data.amount,
              currency: data.currency,
              status: data.status,
              description: data.description,
              stripeInvoiceId: data.stripeInvoiceId ?? existingByIntent.stripeInvoiceId,
            },
          });
        }
      }

      return db.payment.create({ data: paymentData });
    })();
  },
};
