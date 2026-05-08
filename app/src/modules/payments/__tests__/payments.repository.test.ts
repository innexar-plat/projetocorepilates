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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
        expect.objectContaining({
          data: expect.objectContaining({
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            stripePaymentIntentId: data.stripePaymentIntentId,
            user: { connect: { id: data.userId } },
          }),
        }),
      );
      expect(result).toEqual(basePayment);
    });

    it('updates existing payment when stripeInvoiceId already exists', async () => {
      const existingByInvoice = {
        ...basePayment,
        stripeInvoiceId: 'in_123',
        stripePaymentIntentId: 'pi_existing',
      };
      const updatedByInvoice = {
        ...existingByInvoice,
        amount: 25000,
        status: 'processing',
      };

      mockDb.payment.findUnique.mockResolvedValueOnce(existingByInvoice);
      mockDb.payment.update.mockResolvedValueOnce(updatedByInvoice);

      const result = await paymentsRepository.create({
        userId: 'user-uuid-1',
        amount: 25000,
        currency: 'brl',
        status: 'processing',
        stripeInvoiceId: 'in_123',
      } as any);

      expect(mockDb.payment.update).toHaveBeenCalledWith({
        where: { stripeInvoiceId: 'in_123' },
        data: expect.objectContaining({
          amount: 25000,
          status: 'processing',
          stripePaymentIntentId: 'pi_existing',
        }),
      });
      expect(mockDb.payment.create).not.toHaveBeenCalled();
      expect(result).toEqual(updatedByInvoice);
    });

    it('updates existing payment when stripePaymentIntentId already exists', async () => {
      const existingByIntent = {
        ...basePayment,
        stripeInvoiceId: 'in_existing_789',
      };
      const updatedByIntent = {
        ...existingByIntent,
        status: 'succeeded',
      };

      mockDb.payment.findUnique.mockResolvedValueOnce(existingByIntent);
      mockDb.payment.update.mockResolvedValueOnce(updatedByIntent);

      const result = await paymentsRepository.create({
        userId: 'user-uuid-1',
        amount: 19900,
        currency: 'brl',
        status: 'succeeded',
        stripePaymentIntentId: 'pi_123',
      } as any);

      expect(mockDb.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        data: expect.objectContaining({
          stripeInvoiceId: 'in_existing_789',
          status: 'succeeded',
        }),
      });
      expect(mockDb.payment.create).not.toHaveBeenCalled();
      expect(result).toEqual(updatedByIntent);
    });

    it('creates new payment when no invoice or intent duplicate exists', async () => {
      const created = {
        ...basePayment,
        id: 'payment-uuid-new',
        stripeInvoiceId: 'in_new',
      };

      mockDb.payment.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockDb.payment.create.mockResolvedValueOnce(created);

      const result = await paymentsRepository.create({
        userId: 'user-uuid-1',
        amount: 19900,
        currency: 'brl',
        status: 'succeeded',
        stripePaymentIntentId: 'pi_new',
        stripeInvoiceId: 'in_new',
      } as any);

      expect(mockDb.payment.findUnique).toHaveBeenCalledTimes(2);
      expect(mockDb.payment.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(created);
    });
  });
});
