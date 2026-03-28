import { db } from '@/lib/db';
import { classesRepository } from '../repositories/classes.repository';

const mockDb = jest.mocked(db);

const baseClass: any = {
  id: 'class-uuid-1',
  title: 'Pilates Básico',
  description: 'Aula de pilates',
  instructor: 'Ana',
  maxCapacity: 10,
  durationMin: 60,
  dayOfWeek: 'MONDAY',
  startTime: '08:00',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('classesRepository', () => {
  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('uses default onlyActive=false when no arg is passed', async () => {
      mockDb.class.findMany.mockResolvedValue([baseClass]);
      await classesRepository.findAll();
      expect(mockDb.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('returns all classes when onlyActive is false', async () => {
      mockDb.class.findMany.mockResolvedValue([baseClass]);
      const result = await classesRepository.findAll(false);
      expect(mockDb.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
      expect(result).toEqual([baseClass]);
    });

    it('filters by isActive when onlyActive is true', async () => {
      mockDb.class.findMany.mockResolvedValue([baseClass]);
      await classesRepository.findAll(true);
      expect(mockDb.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.class.findUnique with id', async () => {
      mockDb.class.findUnique.mockResolvedValue(baseClass);
      const result = await classesRepository.findById('class-uuid-1');
      expect(mockDb.class.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'class-uuid-1' } }),
      );
      expect(result).toEqual(baseClass);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.class.create with dto data', async () => {
      mockDb.class.create.mockResolvedValue(baseClass);
      const dto = {
        title: 'Pilates Básico',
        instructor: 'Ana',
        maxCapacity: 10,
        durationMin: 60,
        dayOfWeek: 'MONDAY' as const,
        startTime: '08:00',
        isActive: true,
      };
      const result = await classesRepository.create(dto);
      expect(mockDb.class.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: dto }),
      );
      expect(result).toEqual(baseClass);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls db.class.update with id and data', async () => {
      const updated = { ...baseClass, title: 'Pilates Avançado' };
      mockDb.class.update.mockResolvedValue(updated);
      const result = await classesRepository.update('class-uuid-1', { title: 'Pilates Avançado' });
      expect(mockDb.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'class-uuid-1' },
          data: { title: 'Pilates Avançado' },
        }),
      );
      expect(result).toEqual(updated);
    });
  });
});
