import { db } from '@/lib/db';
import { supportRepository } from '../repositories/support.repository';
import { TicketStatus } from '@prisma/client';

const mockDb: any = db;

const baseTicket: any = {
  id: 'ticket-uuid-1',
  userId: 'user-uuid-1',
  subject: 'Cannot book a class',
  status: TicketStatus.OPEN,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  messages: [],
};

describe('supportRepository', () => {
  // ── findById ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('calls db.supportTicket.findUnique with id and includes messages', async () => {
      mockDb.supportTicket.findUnique.mockResolvedValue(baseTicket);
      const result = await supportRepository.findById('ticket-uuid-1');
      expect(mockDb.supportTicket.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ticket-uuid-1' } }),
      );
      expect(result).toEqual(baseTicket);
    });
  });

  // ── listByUser ────────────────────────────────────────────────────────────────
  describe('listByUser', () => {
    it('calls db.supportTicket.findMany with userId', async () => {
      mockDb.supportTicket.findMany.mockResolvedValue([baseTicket]);
      const result = await supportRepository.listByUser('user-uuid-1');
      expect(mockDb.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid-1' } }),
      );
      expect(result).toEqual([baseTicket]);
    });
  });

  // ── listAll ───────────────────────────────────────────────────────────────────
  describe('listAll', () => {
    it('uses default pagination when no args are passed', async () => {
      mockDb.$transaction.mockImplementation((fns: any[]) => Promise.all(fns));
      mockDb.supportTicket.findMany.mockResolvedValue([baseTicket]);
      mockDb.supportTicket.count.mockResolvedValue(1);

      await supportRepository.listAll();

      expect(mockDb.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('returns paginated tickets without status filter', async () => {
      mockDb.$transaction.mockImplementation((fns: any[]) => Promise.all(fns));
      mockDb.supportTicket.findMany.mockResolvedValue([baseTicket]);
      mockDb.supportTicket.count.mockResolvedValue(1);

      const result = await supportRepository.listAll(0, 20);

      expect(mockDb.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      expect(result).toEqual({ items: [baseTicket], total: 1 });
    });

    it('filters by status when provided', async () => {
      mockDb.$transaction.mockImplementation((fns: any[]) => Promise.all(fns));
      mockDb.supportTicket.findMany.mockResolvedValue([]);
      mockDb.supportTicket.count.mockResolvedValue(0);

      await supportRepository.listAll(0, 20, 'OPEN');

      expect(mockDb.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'OPEN' as TicketStatus } }),
      );
    });
  });

  // ── createTicket ──────────────────────────────────────────────────────────────
  describe('createTicket', () => {
    it('calls db.supportTicket.create with userId and subject', async () => {
      mockDb.supportTicket.create.mockResolvedValue(baseTicket);
      const result = await supportRepository.createTicket({
        userId: 'user-uuid-1',
        subject: 'Cannot book a class',
      });
      expect(mockDb.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'user-uuid-1', subject: 'Cannot book a class' },
        }),
      );
      expect(result).toEqual(baseTicket);
    });
  });

  // ── addMessage ────────────────────────────────────────────────────────────────
  describe('addMessage', () => {
    it('calls db.ticketMessage.create with message data', async () => {
      const baseMessage = {
        id: 'msg-uuid-1',
        ticketId: 'ticket-uuid-1',
        userId: 'user-uuid-1',
        message: 'Hello',
        isAdmin: false,
        createdAt: new Date(),
      };
      mockDb.ticketMessage.create.mockResolvedValue(baseMessage);
      const result = await supportRepository.addMessage({
        ticketId: 'ticket-uuid-1',
        userId: 'user-uuid-1',
        message: 'Hello',
        isAdmin: false,
      });
      expect(mockDb.ticketMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            ticketId: 'ticket-uuid-1',
            userId: 'user-uuid-1',
            message: 'Hello',
            isAdmin: false,
          },
        }),
      );
      expect(result).toEqual(baseMessage);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('calls db.supportTicket.update with id and new status', async () => {
      const updated = { ...baseTicket, status: TicketStatus.CLOSED };
      mockDb.supportTicket.update.mockResolvedValue(updated);
      const result = await supportRepository.updateStatus('ticket-uuid-1', TicketStatus.CLOSED);
      expect(mockDb.supportTicket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-uuid-1' },
        data: { status: TicketStatus.CLOSED },
      });
      expect(result).toEqual(updated);
    });
  });
});
