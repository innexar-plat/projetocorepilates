import { db } from '@/lib/db';
import { leadsRepository } from '../repositories/leads.repository';

const mockDb: any = db;

const baseLead: any = {
  id: 'lead-uuid-1',
  name: 'Carlos',
  email: 'carlos@email.com',
  phone: '11999999999',
  status: 'NEW' as any,
  source: null,
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('leadsRepository', () => {
  // ── findById ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.lead.findUnique with id', async () => {
      mockDb.lead.findUnique.mockResolvedValue(baseLead);
      const result = await leadsRepository.findById('lead-uuid-1');
      expect(mockDb.lead.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'lead-uuid-1' } }),
      );
      expect(result).toEqual(baseLead);
    });
  });

  // ── findByEmail ───────────────────────────────────────────────────────────────
  describe('findByEmail', () => {
    it('calls db.lead.findFirst with email', async () => {
      mockDb.lead.findFirst.mockResolvedValue(baseLead);
      const result = await leadsRepository.findByEmail('carlos@email.com');
      expect(mockDb.lead.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'carlos@email.com' } }),
      );
      expect(result).toEqual(baseLead);
    });
  });

  // ── list ─────────────────────────────────────────────────────────────────────
  describe('list', () => {
    it('returns paginated leads without filters', async () => {
      mockDb.lead.findMany.mockResolvedValue([baseLead]);
      mockDb.lead.count.mockResolvedValue(1);

      const result = await leadsRepository.list({ page: 1, limit: 20 });

      expect(mockDb.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      expect(result).toEqual({ data: [baseLead], total: 1 });
    });

    it('filters by status when provided', async () => {
      mockDb.lead.findMany.mockResolvedValue([]);
      mockDb.lead.count.mockResolvedValue(0);

      await leadsRepository.list({ page: 1, limit: 20, status: 'NEW' as any });

      expect(mockDb.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'NEW' }),
        }),
      );
    });

    it('adds search OR clause when search is provided', async () => {
      mockDb.lead.findMany.mockResolvedValue([]);
      mockDb.lead.count.mockResolvedValue(0);

      await leadsRepository.list({ page: 1, limit: 20, search: 'carlos' });

      expect(mockDb.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls db.lead.create with dto data', async () => {
      mockDb.lead.create.mockResolvedValue(baseLead);
      const dto = { name: 'Carlos', email: 'carlos@email.com', phone: '11999999999' };
      const result = await leadsRepository.create(dto as any);
      expect(mockDb.lead.create).toHaveBeenCalled();
      expect(result).toEqual(baseLead);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls db.lead.update with id and data', async () => {
      const updated = { ...baseLead, status: 'CONTACTED' as any };
      mockDb.lead.update.mockResolvedValue(updated);
      const result = await leadsRepository.update('lead-uuid-1', { status: 'CONTACTED' as any });
      expect(mockDb.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'lead-uuid-1' } }),
      );
      expect(result).toEqual(updated);
    });
  });
});
