import { leadsRepository } from '../repositories/leads.repository';
import { NotFoundError } from '@/lib/errors';
import type { CreateLeadDto, UpdateLeadDto, ListLeadsDto } from '../dtos/lead.dto';

export const leadsService = {
  list(dto: ListLeadsDto) {
    return leadsRepository.list(dto);
  },

  async getById(id: string) {
    const lead = await leadsRepository.findById(id);
    if (!lead) throw new NotFoundError('Lead not found');
    return lead;
  },

  // Upsert by email: avoids duplicate leads from the same visitor
  async capture(dto: CreateLeadDto) {
    const existing = await leadsRepository.findByEmail(dto.email);
    if (existing) return existing;
    return leadsRepository.create(dto);
  },

  async update(id: string, dto: UpdateLeadDto) {
    await leadsService.getById(id);
    return leadsRepository.update(id, dto);
  },
};
