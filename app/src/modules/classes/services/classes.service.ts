import { classesRepository } from '../repositories/classes.repository';
import { NotFoundError } from '@/lib/errors';
import type { CreateClassDto, UpdateClassDto } from '../dtos/class.dto';

export const classesService = {
  listAll(onlyActive = false) {
    return classesRepository.findAll(onlyActive);
  },

  async getById(id: string) {
    const cls = await classesRepository.findById(id);
    if (!cls) throw new NotFoundError('Class not found');
    return cls;
  },

  create(dto: CreateClassDto) {
    return classesRepository.create(dto);
  },

  async update(id: string, dto: UpdateClassDto) {
    await classesService.getById(id);
    return classesRepository.update(id, dto);
  },

  async deactivate(id: string) {
    await classesService.getById(id);
    return classesRepository.update(id, { isActive: false });
  },
};
