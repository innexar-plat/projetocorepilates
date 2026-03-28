import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1).max(5000),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
export type ReplyTicketDto = z.infer<typeof replyTicketSchema>;
export type UpdateTicketStatusDto = z.infer<typeof updateTicketStatusSchema>;
