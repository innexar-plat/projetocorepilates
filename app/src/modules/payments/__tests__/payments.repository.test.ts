import { db } from '@/lib/db';
import { paymentsRepository } from '../repositories/payments.repository';

const mockDb: any = db;

const basePayment: any = {
  id: 'payment-uuid-1',
  userId: 'user-uuid-1',
  stripePaymentIntentId: 'pi_123',
  amount: 19900,
  currency: 'brl',
  status: 'succeeded',
  description: null,
  createdAt: new Date('2026-01-01'),
};

describe('paymentsRepository', () => {
  // ── listByUser ──────────────────────────────────────────────────────────────
  describe('listByUser', () => {
    it('paginates payments for given user', async () => {
      mockDb.payment.findMany.mockResolvedValue([basePayment]);
      mockDb.payment.count.mockResolvedValue(1);

      const result = await paymentsRepository.listByUser('user-uuid-1', {
        page: 1,
        limit: 20,
      });

      expect(mockDb.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid-1' } }),
      );
      expect(result).toEqual({ data: [basePayment], total: 1 });
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.payment.create with payment data', async () => {
      mockDb.payment.create.mockResolvedValue(basePayment);
      const data = {
        userId: 'user-uuid-1',
        stripePaymentIntentId: 'pi_123',
        amount: 19900,
        currency: 'brl',
        status: 'succeeded',
      };
      const result = await paymentsRepository.create(data);
      expect(mockDb.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data }),
      );
      expect(result).toEqual(basePayment);
    });
  });
});
