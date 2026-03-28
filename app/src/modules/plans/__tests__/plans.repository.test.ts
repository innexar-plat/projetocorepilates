import { db } from '@/lib/db';
import { plansRepository } from '../repositories/plans.repository';

const mockDb: any = db;

const basePlan: any = {
  id: 'plan-uuid-1',
  name: 'Mensal',
  description: 'Plano mensal',
  stripePriceId: 'price_123',
  stripeProductId: 'prod_123',
  amount: 19900,
  currency: 'brl',
  interval: 'month',
  intervalCount: 1,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('plansRepository', () => {
  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('uses default onlyActive=false when no arg is passed', async () => {
      mockDb.plan.findMany.mockResolvedValue([basePlan]);
      await plansRepository.findAll();
      expect(mockDb.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('returns all plans when onlyActive is false', async () => {
      mockDb.plan.findMany.mockResolvedValue([basePlan]);
      const result = await plansRepository.findAll(false);
      expect(mockDb.plan.findMany).toHaveBeenCalled();
      expect(result).toEqual([basePlan]);
    });

    it('filters by isActive when onlyActive is true', async () => {
      mockDb.plan.findMany.mockResolvedValue([basePlan]);
      await plansRepository.findAll(true);
      expect(mockDb.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.plan.findUnique with id', async () => {
      mockDb.plan.findUnique.mockResolvedValue(basePlan);
      const result = await plansRepository.findById('plan-uuid-1');
      expect(mockDb.plan.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'plan-uuid-1' } }),
      );
      expect(result).toEqual(basePlan);
    });
  });

  // ── findByStripePriceId ─────────────────────────────────────────────────────
  describe('findByStripePriceId', () => {
    it('calls db.plan.findUnique with stripePriceId', async () => {
      mockDb.plan.findUnique.mockResolvedValue(basePlan);
      const result = await plansRepository.findByStripePriceId('price_123');
      expect(mockDb.plan.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { stripePriceId: 'price_123' } }),
      );
      expect(result).toEqual(basePlan);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.plan.create with plan data', async () => {
      mockDb.plan.create.mockResolvedValue(basePlan);
      const data = {
        name: 'Mensal',
        price: 199,
        classesPerMonth: 12,
        order: 1,
        stripePriceId: 'price_123',
        stripeProductId: 'prod_123',
      };
      const result = await plansRepository.create(data);
      expect(mockDb.plan.create).toHaveBeenCalledWith(
        expect.objectContaining({ data }),
      );
      expect(result).toEqual(basePlan);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls db.plan.update with id and data', async () => {
      const updated = { ...basePlan, isActive: false };
      mockDb.plan.update.mockResolvedValue(updated);
      const result = await plansRepository.update('plan-uuid-1', { isActive: false });
      expect(mockDb.plan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'plan-uuid-1' },
          data: { isActive: false },
        }),
      );
      expect(result).toEqual(updated);
    });
  });
});
