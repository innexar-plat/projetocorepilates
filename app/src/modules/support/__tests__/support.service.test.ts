import { supportService } from '../services/support.service';
import { supportRepository } from '../repositories/support.repository';
import { NotFoundError, ForbiddenError } from '@/lib/errors';
import { TicketStatus } from '@prisma/client';

jest.mock('../repositories/support.repository');

const mockRepo = jest.mocked(supportRepository);

const USER_ID = 'user-uuid-1';
const TICKET_ID = 'ticket-uuid-1';

const fakeTicket = {
  id: TICKET_ID,
  userId: USER_ID,
  subject: 'Problema no login',
  status: TicketStatus.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
  messages: [],
};

const fakeMessage = {
  id: 'msg-id-1',
  ticketId: TICKET_ID,
  userId: USER_ID,
  message: 'Não consigo acessar minha conta.',
  isAdmin: false,
  createdAt: new Date(),
};

describe('supportService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listByUser()', () => {
    it('returns tickets for given user', async () => {
      mockRepo.listByUser.mockResolvedValue([fakeTicket] as any);
      const result = await supportService.listByUser(USER_ID);
      expect(mockRepo.listByUser).toHaveBeenCalledWith(USER_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('listAll()', () => {
    it('returns paginated tickets for admin view', async () => {
      mockRepo.listAll.mockResolvedValue({ items: [fakeTicket], total: 1 } as any);
      const result = await supportService.listAll();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getById()', () => {
    it('returns ticket when found', async () => {
      mockRepo.findById.mockResolvedValue(fakeTicket as any);
      const result = await supportService.getById(TICKET_ID);
      expect(result).toEqual(fakeTicket);
    });

    it('throws NotFoundError when ticket does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(supportService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByIdForUser()', () => {
    it('returns ticket when it belongs to the user', async () => {
      mockRepo.findById.mockResolvedValue(fakeTicket as any);
      const result = await supportService.getByIdForUser(TICKET_ID, USER_ID);
      expect(result).toEqual(fakeTicket);
    });

    it('throws ForbiddenError when ticket belongs to another user', async () => {
      mockRepo.findById.mockResolvedValue(fakeTicket as any);
      await expect(supportService.getByIdForUser(TICKET_ID, 'other-user')).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when ticket does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(supportService.getByIdForUser('nonexistent', USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create()', () => {
    it('creates ticket and adds first message', async () => {
      mockRepo.createTicket.mockResolvedValue(fakeTicket as any);
      mockRepo.addMessage.mockResolvedValue(fakeMessage as any);

      const result = await supportService.create(USER_ID, {
        subject: 'Problema no login',
        message: 'Não consigo acessar minha conta.',
      });

      expect(mockRepo.createTicket).toHaveBeenCalledWith({ userId: USER_ID, subject: 'Problema no login' });
      expect(mockRepo.addMessage).toHaveBeenCalledWith({
        ticketId: TICKET_ID,
        userId: USER_ID,
        message: 'Não consigo acessar minha conta.',
        isAdmin: false,
      });
      expect(result.id).toBe(TICKET_ID);
    });
  });

  describe('reply()', () => {
    it('adds a user reply to the ticket', async () => {
      mockRepo.findById.mockResolvedValue(fakeTicket as any);
      mockRepo.addMessage.mockResolvedValue(fakeMessage as any);

      await supportService.reply(TICKET_ID, USER_ID, { message: 'Ainda com o problema.' }, false);

      expect(mockRepo.addMessage).toHaveBeenCalledWith({
        ticketId: TICKET_ID,
        userId: USER_ID,
        message: 'Ainda com o problema.',
        isAdmin: false,
      });
    });

    it('adds an admin reply to the ticket', async () => {
      mockRepo.findById.mockResolvedValue(fakeTicket as any);
      const adminMessage = { ...fakeMessage, isAdmin: true };
      mockRepo.addMessage.mockResolvedValue(adminMessage as any);

      const result = await supportService.reply(TICKET_ID, 'admin-id', { message: 'Resolvemos!' }, true);
      expect(result.isAdmin).toBe(true);
    });

    it('throws NotFoundError when ticket does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(supportService.reply('nonexistent', USER_ID, { message: 'msg' }, false)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateStatus()', () => {
    it('updates ticket status when ticket exists', async () => {
      mockRepo.findById.mockResolvedValue(fakeTicket as any);
      const resolved = { ...fakeTicket, status: TicketStatus.RESOLVED };
      mockRepo.updateStatus.mockResolvedValue(resolved as any);

      const result = await supportService.updateStatus(TICKET_ID, { status: 'RESOLVED' });
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(TICKET_ID, TicketStatus.RESOLVED);
      expect(result.status).toBe(TicketStatus.RESOLVED);
    });

    it('throws NotFoundError when ticket does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(supportService.updateStatus('nonexistent', { status: 'RESOLVED' })).rejects.toThrow(NotFoundError);
    });
  });
});
