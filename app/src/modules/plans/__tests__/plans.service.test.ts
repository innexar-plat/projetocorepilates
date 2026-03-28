import { plansService } from '../services/plans.service';
import { plansRepository } from '../repositories/plans.repository';
import { NotFoundError } from '@/lib/errors';

jest.mock('../repositories/plans.repository');

const mockRepo = jest.mocked(plansRepository);

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
  beforeEach(() => jest.clearAllMocks());

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
});
