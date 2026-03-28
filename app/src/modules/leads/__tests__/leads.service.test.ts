import { leadsService } from '../services/leads.service';
import { leadsRepository } from '../repositories/leads.repository';
import { NotFoundError } from '@/lib/errors';
import { LeadStatus } from '@prisma/client';

jest.mock('../repositories/leads.repository');

const mockRepo = jest.mocked(leadsRepository);

const fakeLead = {
  id: 'lead-id-1',
  name: 'Ana Lima',
  email: 'ana@email.com',
  phone: '11999999999',
  source: 'instagram',
  status: LeadStatus.NEW,
  notes: null,
  utm: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('leadsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list()', () => {
    it('delegates to repository with pagination dto', async () => {
      mockRepo.list.mockResolvedValue({ data: [fakeLead], total: 1 });
      const result = await leadsService.list({ page: 1, limit: 20 });
      expect(mockRepo.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
    });
  });

  describe('getById()', () => {
    it('returns lead when found', async () => {
      mockRepo.findById.mockResolvedValue(fakeLead as any);
      const result = await leadsService.getById('lead-id-1');
      expect(result).toEqual(fakeLead);
    });

    it('throws NotFoundError when lead does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(leadsService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('capture()', () => {
    const dto = {
      name: 'Ana Lima',
      email: 'ana@email.com',
      phone: '11999999999',
      source: 'instagram',
    };

    it('creates a new lead when email does not exist', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(fakeLead as any);
      const result = await leadsService.capture(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result.email).toBe('ana@email.com');
    });

    it('returns existing lead without creating a duplicate', async () => {
      mockRepo.findByEmail.mockResolvedValue(fakeLead as any);
      const result = await leadsService.capture(dto);
      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual(fakeLead);
    });
  });

  describe('update()', () => {
    it('updates lead when it exists', async () => {
      mockRepo.findById.mockResolvedValue(fakeLead as any);
      const updated = { ...fakeLead, status: 'CONTACTED', notes: 'Ligou interessado' };
      mockRepo.update.mockResolvedValue(updated as any);
      const result = await leadsService.update('lead-id-1', { status: 'CONTACTED', notes: 'Ligou interessado' });
      expect(mockRepo.update).toHaveBeenCalledWith('lead-id-1', { status: 'CONTACTED', notes: 'Ligou interessado' });
      expect(result.status).toBe('CONTACTED');
    });

    it('throws NotFoundError when lead does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(leadsService.update('nonexistent', { status: 'CONTACTED' })).rejects.toThrow(NotFoundError);
    });
  });
});
