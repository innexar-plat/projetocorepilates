import { classesService } from '../services/classes.service';
import { classesRepository } from '../repositories/classes.repository';
import { NotFoundError } from '@/lib/errors';

jest.mock('../repositories/classes.repository');

const mockRepo = jest.mocked(classesRepository);

const fakeClass = {
  id: 'class-id-1',
  title: 'Pilates Reformer',
  description: 'Aula avançada',
  instructor: 'João Silva',
  maxCapacity: 10,
  durationMin: 60,
  dayOfWeek: 'MONDAY' as const,
  startTime: '08:00',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inactiveClass = { ...fakeClass, id: 'class-id-2', isActive: false };

describe('classesService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listAll()', () => {
    it('returns all classes when onlyActive is false (default)', async () => {
      mockRepo.findAll.mockResolvedValue([fakeClass, inactiveClass]);
      const result = await classesService.listAll();
      expect(mockRepo.findAll).toHaveBeenCalledWith(false);
      expect(result).toHaveLength(2);
    });

    it('returns only active classes when onlyActive is true', async () => {
      mockRepo.findAll.mockResolvedValue([fakeClass]);
      const result = await classesService.listAll(true);
      expect(mockRepo.findAll).toHaveBeenCalledWith(true);
      expect(result).toHaveLength(1);
    });
  });

  describe('getById()', () => {
    it('returns the class when found', async () => {
      mockRepo.findById.mockResolvedValue(fakeClass);
      const result = await classesService.getById('class-id-1');
      expect(result).toEqual(fakeClass);
    });

    it('throws NotFoundError when class does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(classesService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create()', () => {
    it('delegates creation to the repository', async () => {
      const dto = {
        title: 'Mat Pilates',
        instructor: 'Maria Souza',
        maxCapacity: 15,
        durationMin: 45,
        dayOfWeek: 'WEDNESDAY' as const,
        startTime: '10:00',
        isActive: true,
      };
      mockRepo.create.mockResolvedValue({ ...fakeClass, ...dto });
      const result = await classesService.create(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result.title).toBe('Mat Pilates');
    });
  });

  describe('update()', () => {
    it('updates the class when it exists', async () => {
      mockRepo.findById.mockResolvedValue(fakeClass);
      const updated = { ...fakeClass, title: 'Pilates Solo' };
      mockRepo.update.mockResolvedValue(updated);
      const result = await classesService.update('class-id-1', { title: 'Pilates Solo' });
      expect(mockRepo.update).toHaveBeenCalledWith('class-id-1', { title: 'Pilates Solo' });
      expect(result.title).toBe('Pilates Solo');
    });

    it('throws NotFoundError when class does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(classesService.update('nonexistent', { title: 'X' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('deactivate()', () => {
    it('sets isActive to false when class exists', async () => {
      mockRepo.findById.mockResolvedValue(fakeClass);
      mockRepo.update.mockResolvedValue({ ...fakeClass, isActive: false });
      const result = await classesService.deactivate('class-id-1');
      expect(mockRepo.update).toHaveBeenCalledWith('class-id-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundError when class does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(classesService.deactivate('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
