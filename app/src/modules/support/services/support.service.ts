import { supportRepository } from '../repositories/support.repository';
import { NotFoundError, ForbiddenError } from '@/lib/errors';
import { TicketStatus } from '@prisma/client';
import type { CreateTicketDto, ReplyTicketDto, UpdateTicketStatusDto } from '../dtos/ticket.dto';

export const supportService = {
  listByUser(userId: string) {
    return supportRepository.listByUser(userId);
  },

  async listAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const { items, total } = await supportRepository.listAll(skip, limit, status);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(id: string) {
    const ticket = await supportRepository.findById(id);
    if (!ticket) throw new NotFoundError('Ticket not found');
    return ticket;
  },

  async getByIdForUser(id: string, userId: string) {
    const ticket = await supportService.getById(id);
    if (ticket.userId !== userId) throw new ForbiddenError('Access denied');
    return ticket;
  },

  async create(userId: string, dto: CreateTicketDto) {
    const ticket = await supportRepository.createTicket({ userId, subject: dto.subject });
    await supportRepository.addMessage({
      ticketId: ticket.id,
      userId,
      message: dto.message,
      isAdmin: false,
    });
    return ticket;
  },

  async reply(ticketId: string, userId: string, dto: ReplyTicketDto, isAdmin: boolean) {
    await supportService.getById(ticketId);
    return supportRepository.addMessage({ ticketId, userId, message: dto.message, isAdmin });
  },

  async updateStatus(id: string, dto: UpdateTicketStatusDto) {
    await supportService.getById(id);
    return supportRepository.updateStatus(id, dto.status as TicketStatus);
  },
};
