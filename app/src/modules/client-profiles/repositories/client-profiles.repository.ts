import { db } from '@/lib/db';
import type { ClientProfileDto, PhysicalAssessmentDto } from '../dtos/client-profile.dto';

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

  // Admin: list profiles needing completion (for follow-up)
  listIncomplete(skip = 0, take = 20) {
    return db.clientProfile.findMany({
      where: { isComplete: false },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },
};
