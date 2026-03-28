import { paymentsService } from '../services/payments.service';
import { paymentsRepository } from '../repositories/payments.repository';
import { PaymentStatus } from '@prisma/client';

jest.mock('../repositories/payments.repository');

const mockRepo = jest.mocked(paymentsRepository);

const USER_ID = 'user-uuid-1';

const fakePayment = {
  id: 'pay-id',
  amount: 347 as any, // Prisma returns Decimal; cast for test simplicity
  currency: 'usd',
  status: PaymentStatus.SUCCEEDED,
  description: 'Essential Plan subscription',
  stripePaymentIntentId: 'pi_abc',
  stripeInvoiceId: 'in_abc',
  createdAt: new Date(),
};

describe('paymentsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listByUser()', () => {
    it('returns paginated list of payments for user', async () => {
      mockRepo.listByUser.mockResolvedValue({ data: [fakePayment], total: 1 });
      const result = await paymentsService.listByUser(USER_ID, { page: 1, limit: 20 });
      expect(mockRepo.listByUser).toHaveBeenCalledWith(USER_ID, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('returns empty list when user has no payments', async () => {
      mockRepo.listByUser.mockResolvedValue({ data: [], total: 0 });
      const result = await paymentsService.listByUser(USER_ID, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('recordPayment()', () => {
    it('delegates payment recording to the repository', async () => {
      mockRepo.create.mockResolvedValue(fakePayment as any);
      const data = {
        userId: USER_ID,
        amount: 347,
        currency: 'usd',
        status: PaymentStatus.SUCCEEDED,
        description: 'Essential Plan subscription',
        stripePaymentIntentId: 'pi_abc',
        stripeInvoiceId: 'in_abc',
      };
      const result = await paymentsService.recordPayment(data);
      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(result.amount).toBe(347);
    });

    it('records payment without optional stripe fields', async () => {
      const minPayment = { ...fakePayment, stripePaymentIntentId: null, stripeInvoiceId: null };
      mockRepo.create.mockResolvedValue(minPayment as any);
      const result = await paymentsService.recordPayment({
        userId: USER_ID,
        amount: 197,
        status: PaymentStatus.SUCCEEDED,
      });
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
