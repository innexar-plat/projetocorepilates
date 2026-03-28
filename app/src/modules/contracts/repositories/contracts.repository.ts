import { db } from '@/lib/db';

export const contractsRepository = {
  findByUserId(userId: string) {
    return db.contract.findFirst({
      where: { userId },
      include: {
        clientProfile: {
          select: {
            id: true,
            isComplete: true,
            userId: true,
          },
        },
      },
    });
  },

  findById(id: string) {
    return db.contract.findUnique({ where: { id } });
  },

  create(data: {
    clientProfileId: string;
    userId: string;
    version: string;
    content: string;
  }) {
    return db.contract.create({ data });
  },

  sign(
    id: string,
    data: {
      signatureData: string;
      ipAddress: string;
      userAgent: string;
      fileUrl?: string;
    },
  ) {
    return db.contract.update({
      where: { id },
      data: {
        ...data,
        signedAt: new Date(),
        isSigned: true,
      },
    });
  },

  updateFileUrl(id: string, fileUrl: string) {
    return db.contract.update({ where: { id }, data: { fileUrl } });
  },
};
