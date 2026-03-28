import { paymentsRepository, type ListPaymentsDto } from '../repositories/payments.repository';

export const paymentsService = {
  listByUser(userId: string, dto: ListPaymentsDto) {
    return paymentsRepository.listByUser(userId, dto);
  },

  // Called from Stripe webhook: payment_intent.succeeded / invoice.paid
  recordPayment(data: {
    userId: string;
    amount: number;
    currency?: string;
    status: string;
    description?: string;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
  }) {
    return paymentsRepository.create(data);
  },
};
