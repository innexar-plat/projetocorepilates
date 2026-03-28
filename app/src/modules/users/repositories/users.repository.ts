import { db } from '@/lib/db';
import type { UpdateUserDto } from '../dtos/user.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  stripeCustomerId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export const usersRepository = {
  findById(id: string) {
    return db.user.findFirst({
      where: { id, deletedAt: null },
      select: safeUserSelect,
    });
  },

  findByEmail(email: string) {
    return db.user.findFirst({
      where: { email, deletedAt: null },
      select: { ...safeUserSelect, passwordHash: true },
    });
  },

  findByStripeCustomerId(stripeCustomerId: string) {
    return db.user.findFirst({
      where: { stripeCustomerId, deletedAt: null },
      select: safeUserSelect,
    });
  },

  async list(params: {
    skip: number;
    take: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const where = {
      deletedAt: null,
      role: 'CLIENT' as const,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { email: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await db.$transaction([
      db.user.findMany({
        where,
        select: safeUserSelect,
        skip: params.skip,
        take: params.take,
        orderBy: { [params.sortBy ?? 'createdAt']: params.order ?? 'desc' },
      }),
      db.user.count({ where }),
    ]);

    return { items, total };
  },

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
    stripeCustomerId?: string;
  }) {
    return db.user.create({
      data,
      select: safeUserSelect,
    });
  },

  update(id: string, data: UpdateUserDto) {
    return db.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  },

  updatePassword(id: string, passwordHash: string) {
    return db.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
    });
  },

  updateStripeCustomerId(id: string, stripeCustomerId: string) {
    return db.user.update({
      where: { id },
      data: { stripeCustomerId },
      select: safeUserSelect,
    });
  },

  softDelete(id: string) {
    return db.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: { id: true },
    });
  },

  setPasswordResetToken(id: string, token: string, expiry: Date) {
    return db.user.update({
      where: { id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
      select: { id: true },
    });
  },

  findByPasswordResetToken(token: string) {
    return db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
        deletedAt: null,
      },
      select: { id: true, email: true, name: true },
    });
  },

  clearPasswordResetToken(id: string) {
    return db.user.update({
      where: { id },
      data: { passwordResetToken: null, passwordResetExpiry: null },
      select: { id: true },
    });
  },

  updateRole(id: string, role: 'ADMIN' | 'CLIENT') {
    return db.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  },
};
