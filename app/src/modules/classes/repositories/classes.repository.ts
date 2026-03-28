import { db } from '@/lib/db';
import type { CreateClassDto, UpdateClassDto } from '../dtos/class.dto';

export const classesRepository = {
  findAll(onlyActive = false) {
    return db.class.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        instructor: true,
        maxCapacity: true,
        durationMin: true,
        dayOfWeek: true,
        startTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findById(id: string) {
    return db.class.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        instructor: true,
        maxCapacity: true,
        durationMin: true,
        dayOfWeek: true,
        startTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  create(data: CreateClassDto) {
    return db.class.create({ data });
  },

  update(id: string, data: UpdateClassDto) {
    return db.class.update({ where: { id }, data });
  },
};
