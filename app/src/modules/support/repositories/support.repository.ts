import { db } from '@/lib/db';
import { TicketStatus } from '@prisma/client';

export const supportRepository = {
  findById(id: string) {
    return db.supportTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  },

  listByUser(userId: string) {
    return db.supportTicket.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async listAll(skip = 0, take = 20, status?: string) {
    const where = status ? { status: status as TicketStatus } : {};
    const [items, total] = await db.$transaction([
      db.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      db.supportTicket.count({ where }),
    ]);
    return { items, total };
  },

  createTicket(data: { userId: string; subject: string }) {
    return db.supportTicket.create({ data });
  },

  addMessage(data: { ticketId: string; userId: string; message: string; isAdmin: boolean }) {
    return db.ticketMessage.create({ data });
  },

  updateStatus(id: string, status: TicketStatus) {
    return db.supportTicket.update({ where: { id }, data: { status } });
  },
};
