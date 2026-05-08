import { plansService } from '../services/plans.service';
import { plansRepository } from '../repositories/plans.repository';
import { NotFoundError } from '@/lib/errors';

jest.mock('../repositories/plans.repository');
jest.mock('@/lib/stripe', () => ({
  stripe: {
    products: {
      create: jest.fn(),
    },
    prices: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  stripeCall: jest.fn(async (_description: string, fn: () => Promise<unknown>) => fn()),
}));

const mockRepo = jest.mocked(plansRepository);

const mockedStripeModule = jest.mocked(jest.requireMock('@/lib/stripe'));
const mockStripe = mockedStripeModule.stripe as {
  products: { create: jest.Mock };
  prices: { create: jest.Mock; retrieve: jest.Mock };
};

const fakePlan = {
  id: 'plan-id-1',
  name: 'Essential',
  description: 'Descrição do plano',
  price: 347 as any, // Prisma returns Decimal; cast for test simplicity
  stripePriceId: 'price_abc123',
  stripeProductId: 'prod_abc123',
  classesPerMonth: 12,
  order: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inactivePlan = { ...fakePlan, id: 'plan-id-2', isActive: false };

describe('plansService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_DEFAULT_CURRENCY = 'usd';
  });

  // ─── listAll ──────────────────────────────────────────────────────────────

  describe('listAll()', () => {
    it('returns all plans when onlyActive is false (default)', async () => {
      mockRepo.findAll.mockResolvedValue([fakePlan, inactivePlan]);
      const result = await plansService.listAll();
      expect(mockRepo.findAll).toHaveBeenCalledWith(false);
      expect(result).toHaveLength(2);
    });

    it('returns only active plans when onlyActive is true', async () => {
      mockRepo.findAll.mockResolvedValue([fakePlan]);
      const result = await plansService.listAll(true);
      expect(mockRepo.findAll).toHaveBeenCalledWith(true);
      expect(result).toHaveLength(1);
    });
  });

  // ─── getById ──────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('returns the plan when found', async () => {
      mockRepo.findById.mockResolvedValue(fakePlan);
      const result = await plansService.getById('plan-id-1');
      expect(result).toEqual(fakePlan);
    });

    it('throws NotFoundError when plan does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(plansService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── getActiveById ────────────────────────────────────────────────────────

  describe('getActiveById()', () => {
    it('returns the active plan when found and active', async () => {
      mockRepo.findById.mockResolvedValue(fakePlan);
      const result = await plansService.getActiveById('plan-id-1');
      expect(result).toEqual(fakePlan);
    });

    it('throws NotFoundError when plan does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(plansService.getActiveById('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when plan exists but is inactive', async () => {
      mockRepo.findById.mockResolvedValue(inactivePlan);
      await expect(plansService.getActiveById('plan-id-2')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('delegates creation to the repository', async () => {
      const dto = {
        name: 'Starter',
        price: 197 as any, // Prisma Decimal cast
        stripePriceId: 'price_xyz',
        stripeProductId: 'prod_xyz',
        classesPerMonth: 8,
        order: 0,
      };
      mockRepo.create.mockResolvedValue({ ...fakePlan, ...dto });
      const result = await plansService.create(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('Starter');
    });

    it('normalizes promotion payload and stripe ids before creating', async () => {
      const dto = {
        name: 'Promo Plan',
        price: 300,
        isPromotion: true,
        promotionalPrice: 199,
        stripePriceId: '   ',
        stripeProductId: '  prod_valid123  ',
        classesPerMonth: 6,
        order: 2,
      };

      mockRepo.create.mockResolvedValue({
        ...fakePlan,
        ...dto,
        isActive: false,
        price: 199,
        stripePriceId: null,
        stripeProductId: 'prod_valid123',
      });

      await plansService.create(dto as any);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 199,
          isPromotion: true,
          originalPrice: 300,
          promotionalPrice: 199,
          stripeProductId: 'prod_valid123',
        }),
      );
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stripePriceId: expect.anything(),
        }),
      );
    });

    it('does not sync with stripe when created plan is inactive', async () => {
      const dto = {
        name: 'Inactive Plan',
        price: 120,
        classesPerMonth: 4,
        order: 3,
      };

      mockRepo.create.mockResolvedValue({
        ...fakePlan,
        ...dto,
        id: 'inactive-created',
        isActive: false,
      });

      await plansService.create(dto as any);

      expect(mockStripe.products.create).not.toHaveBeenCalled();
      expect(mockStripe.prices.create).not.toHaveBeenCalled();
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('returns refreshed plan when sync creates stripe ids', async () => {
      const created = {
        ...fakePlan,
        id: 'created-sync-id',
        stripeProductId: null,
        stripePriceId: null,
      };

      mockRepo.create.mockResolvedValue(created);
      mockStripe.products.create.mockResolvedValue({ id: 'prod_created_sync' });
      mockStripe.prices.create.mockResolvedValue({ id: 'price_created_sync' });
      mockRepo.update.mockResolvedValue({
        ...created,
        stripeProductId: 'prod_created_sync',
        stripePriceId: 'price_created_sync',
      });
      mockRepo.findById.mockResolvedValue({
        ...created,
        stripeProductId: 'prod_created_sync',
        stripePriceId: 'price_created_sync',
      });

      const result = await plansService.create({
        name: 'Needs Sync',
        price: 250,
        classesPerMonth: 10,
        order: 4,
      } as any);

      expect(mockRepo.update).toHaveBeenCalledWith('created-sync-id', {
        stripeProductId: 'prod_created_sync',
        stripePriceId: 'price_created_sync',
      });
      expect(result.stripeProductId).toBe('prod_created_sync');
      expect(result.stripePriceId).toBe('price_created_sync');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('updates the plan when it exists', async () => {
      mockRepo.findById.mockResolvedValue(fakePlan);
      const updated = { ...fakePlan, name: 'Premium' };
      mockRepo.update.mockResolvedValue(updated);
      const result = await plansService.update('plan-id-1', { name: 'Premium' });
      expect(mockRepo.update).toHaveBeenCalledWith('plan-id-1', { name: 'Premium' });
      expect(result.name).toBe('Premium');
    });

    it('throws NotFoundError when plan does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(plansService.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
    });

    it('normalizes empty stripe ids and disables promotion keeping history fields untouched', async () => {
      mockRepo.findById.mockResolvedValue({
        ...fakePlan,
        isPromotion: true,
        originalPrice: 500 as any,
        promotionalPrice: 300 as any,
      });
      mockRepo.update.mockResolvedValue({
        ...fakePlan,
        isPromotion: false,
      });

      await plansService.update('plan-id-1', {
        isPromotion: false,
        stripePriceId: '   ',
        stripeProductId: '  ',
      });

      expect(mockRepo.update).toHaveBeenCalledWith(
        'plan-id-1',
        expect.objectContaining({
          isPromotion: false,
          stripePriceId: undefined,
          stripeProductId: undefined,
        }),
      );
      expect(mockRepo.update).toHaveBeenCalledWith(
        'plan-id-1',
        expect.not.objectContaining({
          originalPrice: expect.anything(),
          promotionalPrice: expect.anything(),
        }),
      );
    });

    it('forces new stripe price when billing price changes', async () => {
      const existing = {
        ...fakePlan,
        price: 100 as any,
        stripeProductId: 'prod_force123',
        stripePriceId: 'price_force123',
      };

      const afterBusinessUpdate = {
        ...existing,
        price: 150 as any,
      };

      mockRepo.findById.mockResolvedValueOnce(existing).mockResolvedValueOnce({
        ...afterBusinessUpdate,
        stripePriceId: 'price_new_force',
      });
      mockRepo.update
        .mockResolvedValueOnce(afterBusinessUpdate)
        .mockResolvedValueOnce({
          ...afterBusinessUpdate,
          stripePriceId: 'price_new_force',
        });
      mockStripe.prices.create.mockResolvedValue({ id: 'price_new_force' });

      const result = await plansService.update('plan-id-1', { price: 150 });

      expect(mockStripe.prices.create).toHaveBeenCalledTimes(1);
      expect(mockStripe.products.create).not.toHaveBeenCalled();
      expect(mockRepo.update).toHaveBeenNthCalledWith(2, 'plan-id-1', {
        stripeProductId: 'prod_force123',
        stripePriceId: 'price_new_force',
      });
      expect(result.stripePriceId).toBe('price_new_force');
    });
  });

  // ─── deactivate ───────────────────────────────────────────────────────────

  describe('deactivate()', () => {
    it('sets isActive to false when plan exists', async () => {
      mockRepo.findById.mockResolvedValue(fakePlan);
      mockRepo.update.mockResolvedValue({ ...fakePlan, isActive: false });
      const result = await plansService.deactivate('plan-id-1');
      expect(mockRepo.update).toHaveBeenCalledWith('plan-id-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundError when plan does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(plansService.deactivate('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('syncActivePlansWithStripe()', () => {
    it('returns empty summary when there are no active plans', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      const result = await plansService.syncActivePlansWithStripe();

      expect(result).toEqual({
        totalActivePlans: 0,
        reusedCount: 0,
        syncedCount: 0,
        plans: [],
      });
    });

    it('reuses valid stripe ids and does not update the plan', async () => {
      mockRepo.findAll.mockResolvedValue([fakePlan]);

      const result = await plansService.syncActivePlansWithStripe();

      expect(mockRepo.update).not.toHaveBeenCalled();
      expect(mockStripe.products.create).not.toHaveBeenCalled();
      expect(mockStripe.prices.create).not.toHaveBeenCalled();
      expect(result.reusedCount).toBe(1);
      expect(result.syncedCount).toBe(0);
      expect(result.plans[0]?.status).toBe('reused');
    });

    it('creates stripe product and price for plans with placeholder ids', async () => {
      mockRepo.findAll.mockResolvedValue([
        {
          ...fakePlan,
          stripeProductId: 'placeholder_product',
          stripePriceId: 'placeholder_price',
        },
      ]);
      mockStripe.products.create.mockResolvedValue({ id: 'prod_real_123' });
      mockStripe.prices.create.mockResolvedValue({ id: 'price_real_123' });
      mockRepo.update.mockResolvedValue({
        ...fakePlan,
        stripeProductId: 'prod_real_123',
        stripePriceId: 'price_real_123',
      });

      const result = await plansService.syncActivePlansWithStripe();

      expect(mockStripe.products.create).toHaveBeenCalledTimes(1);
      expect(mockStripe.prices.create).toHaveBeenCalledTimes(1);
      expect(mockRepo.update).toHaveBeenCalledWith(fakePlan.id, {
        stripeProductId: 'prod_real_123',
        stripePriceId: 'price_real_123',
      });
      expect(result.syncedCount).toBe(1);
      expect(result.reusedCount).toBe(0);
      expect(result.plans[0]?.status).toBe('synced');
    });

    it('retrieves stripe product from existing valid stripe price when product is invalid', async () => {
      mockRepo.findAll.mockResolvedValue([
        {
          ...fakePlan,
          stripeProductId: 'invalid_product',
          stripePriceId: 'price_abc123',
        },
      ]);
      mockStripe.prices.retrieve.mockResolvedValue({ product: 'prod_recovered_123' });

      const result = await plansService.syncActivePlansWithStripe();

      expect(mockStripe.prices.retrieve).toHaveBeenCalledWith('price_abc123');
      expect(mockStripe.products.create).not.toHaveBeenCalled();
      expect(mockStripe.prices.create).not.toHaveBeenCalled();
      expect(mockRepo.update).toHaveBeenCalledWith(fakePlan.id, {
        stripeProductId: 'prod_recovered_123',
        stripePriceId: 'price_abc123',
      });
      expect(result.syncedCount).toBe(1);
    });

    it('supports stripe price.product as object and persists recovered product id', async () => {
      mockRepo.findAll.mockResolvedValue([
        {
          ...fakePlan,
          stripeProductId: 'invalid_product',
          stripePriceId: 'price_abc123',
        },
      ]);
      mockStripe.prices.retrieve.mockResolvedValue({ product: { id: 'prod_obj_456' } });

      await plansService.syncActivePlansWithStripe();

      expect(mockRepo.update).toHaveBeenCalledWith(fakePlan.id, {
        stripeProductId: 'prod_obj_456',
        stripePriceId: 'price_abc123',
      });
    });

    it('uses usd as default currency and omits description when null', async () => {
      delete process.env.STRIPE_DEFAULT_CURRENCY;
      mockRepo.findAll.mockResolvedValue([
        {
          ...fakePlan,
          description: null,
          stripeProductId: null,
          stripePriceId: null,
        },
      ]);
      mockStripe.products.create.mockResolvedValue({ id: 'prod_real_999' });
      mockStripe.prices.create.mockResolvedValue({ id: 'price_real_999' });

      await plansService.syncActivePlansWithStripe();

      expect(mockStripe.products.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: undefined,
        }),
      );
      expect(mockStripe.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
        }),
      );
    });

    it('throws when plan price is invalid for stripe unit amount', async () => {
      mockRepo.findAll.mockResolvedValue([
        {
          ...fakePlan,
          price: 0,
          stripeProductId: null,
          stripePriceId: null,
        },
      ]);
      mockStripe.products.create.mockResolvedValue({ id: 'prod_created_123' });

      await expect(plansService.syncActivePlansWithStripe()).rejects.toThrow(
        'Invalid plan price to create Stripe price',
      );
    });
  });
});
