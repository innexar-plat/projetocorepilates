import { db } from '@/lib/db';
import type { CreatePlanDto, UpdatePlanDto } from '../dtos/plan.dto';

const planSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  stripePriceId: true,
  stripeProductId: true,
  classesPerMonth: true,
  isActive: true,
  order: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const plansRepository = {
  findAll(onlyActive = false) {
    return db.plan.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      select: planSelect,
      orderBy: { order: 'asc' },
    });
  },

  findById(id: string) {
    return db.plan.findUnique({ where: { id }, select: planSelect });
  },

  findByStripePriceId(stripePriceId: string) {
    return db.plan.findUnique({ where: { stripePriceId }, select: planSelect });
  },

  create(data: CreatePlanDto) {
    return db.plan.create({ data, select: planSelect });
  },

  update(id: string, data: UpdatePlanDto) {
    return db.plan.update({ where: { id }, data, select: planSelect });
  },
};
