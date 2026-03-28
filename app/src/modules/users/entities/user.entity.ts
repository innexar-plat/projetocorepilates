import type { UserRole } from '@prisma/client';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  stripeCustomerId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type SafeUser = Omit<UserEntity, 'deletedAt'>;
