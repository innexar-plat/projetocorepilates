import { db } from '@/lib/db';
import type { ClientProfileDto, PhysicalAssessmentDto } from '../dtos/client-profile.dto';

type ProfileStatusFilter = 'all' | 'incomplete' | 'complete';

export const clientProfilesRepository = {
  findByUserId(userId: string) {
    return db.clientProfile.findUnique({
      where: { userId },
      include: { contract: { select: { id: true, isSigned: true, signedAt: true } } },
    });
  },

  create(userId: string, data: ClientProfileDto) {
    return db.clientProfile.create({
      data: {
        userId,
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
  },

  update(userId: string, data: Partial<ClientProfileDto>) {
    return db.clientProfile.update({
      where: { userId },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
  },

  markComplete(userId: string) {
    return db.clientProfile.update({
      where: { userId },
      data: { isComplete: true, completedAt: new Date() },
    });
  },

  updateAssessment(userId: string, data: PhysicalAssessmentDto, assessedByUserId: string) {
    return db.clientProfile.update({
      where: { userId },
      data: {
        ...data,
        assessedAt: new Date(),
        assessedByUserId,
      },
    });
  },

  async deleteByUserId(userId: string) {
    const profile = await db.clientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return null;
    }

    await db.$transaction([
      db.contract.deleteMany({ where: { clientProfileId: profile.id } }),
      db.clientProfile.delete({ where: { userId } }),
    ]);

    return profile;
  },

  // Admin: list client profiles with optional status filter.
  async list(skip = 0, take = 20, status: ProfileStatusFilter = 'all') {
    const where =
      status === 'incomplete'
        ? { isComplete: false }
        : status === 'complete'
          ? { isComplete: true }
          : {};

    const [items, total] = await db.$transaction([
      db.clientProfile.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.clientProfile.count({ where }),
    ]);

    return { items, total };
  },
};
