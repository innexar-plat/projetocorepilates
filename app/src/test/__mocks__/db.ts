/**
 * Global Jest mock for Prisma db client.
 * This prevents PrismaClient from being instantiated during tests.
 * All Prisma model methods are mocked as jest.fn() so repository tests
 * can set up expectations with mockResolvedValue / mockRejectedValue.
 */

const createModelMock = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  upsert: jest.fn(),
});

export const db = {
  user: createModelMock(),
  booking: createModelMock(),
  class: createModelMock(),
  classSession: createModelMock(),
  plan: createModelMock(),
  payment: createModelMock(),
  subscription: createModelMock(),
  clientProfile: createModelMock(),
  contract: createModelMock(),
  lead: createModelMock(),
  supportTicket: createModelMock(),
  ticketMessage: createModelMock(),
  referral: createModelMock(),
  $transaction: jest.fn(),
};
