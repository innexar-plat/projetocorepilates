import { db } from '@/lib/db';
import { parsePagination } from '@/lib/api';
import type { CreateLeadDto, UpdateLeadDto, ListLeadsDto } from '../dtos/lead.dto';
import { LeadStatus } from '@prisma/client';

export const leadsRepository = {
  findById(id: string) {
    return db.lead.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return db.lead.findFirst({ where: { email } });
  },

  async list(dto: ListLeadsDto) {
    const { skip, take } = parsePagination(dto);
    const whereClause = {
      ...(dto.status ? { status: dto.status as LeadStatus } : {}),
      ...(dto.search
        ? {
            OR: [
              { name: { contains: dto.search, mode: 'insensitive' as const } },
              { email: { contains: dto.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      db.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.lead.count({ where: whereClause }),
    ]);
    return { data, total };
  },

  create(data: CreateLeadDto) {
    return db.lead.create({ data: data as any });
  },

  update(id: string, data: UpdateLeadDto) {
    return db.lead.update({ where: { id }, data: data as any });
  },
};
