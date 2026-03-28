import { plansRepository } from '../repositories/plans.repository';
import { NotFoundError } from '@/lib/errors';
import type { CreatePlanDto, UpdatePlanDto } from '../dtos/plan.dto';

export const plansService = {
  listAll(onlyActive = false) {
    return plansRepository.findAll(onlyActive);
  },

  async getById(id: string) {
    const plan = await plansRepository.findById(id);
    if (!plan) throw new NotFoundError('Plan not found');
    return plan;
  },

  async getActiveById(id: string) {
    const plan = await plansService.getById(id);
    if (!plan.isActive) throw new NotFoundError('Plan not found or inactive');
    return plan;
  },

  create(dto: CreatePlanDto) {
    return plansRepository.create(dto);
  },

  async update(id: string, dto: UpdatePlanDto) {
    await plansService.getById(id); // ensure exists
    return plansRepository.update(id, dto);
  },

  async deactivate(id: string) {
    await plansService.getById(id);
    return plansRepository.update(id, { isActive: false });
  },
};
