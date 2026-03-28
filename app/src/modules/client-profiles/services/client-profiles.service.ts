import { clientProfilesRepository } from '../repositories/client-profiles.repository';
import { contractsService } from '@/modules/contracts/services/contracts.service';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  clientProfileCompleteSchema,
  type ClientProfileDto,
  type PhysicalAssessmentDto,
} from '../dtos/client-profile.dto';

export const clientProfilesService = {
  async getByUserId(userId: string) {
    const profile = await clientProfilesRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError('Client profile not found');
    return profile;
  },

  /**
   * Creates profile if it doesn't exist, updates if it does.
   * Called right after payment to initialise the record — may be partial.
   */
  async upsert(userId: string, data: ClientProfileDto) {
    const existing = await clientProfilesRepository.findByUserId(userId);

    if (existing) {
      return clientProfilesRepository.update(userId, data);
    }

    return clientProfilesRepository.create(userId, data);
  },

  /**
   * Validates that the profile is fully complete (all required fields + consents),
   * then marks it as complete and generates the contract for signing.
   */
  async complete(userId: string, data: ClientProfileDto) {
    const parsed = clientProfileCompleteSchema.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError(
        'Profile is not complete',
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      );
    }

    const profile = await this.upsert(userId, parsed.data);
    await clientProfilesRepository.markComplete(userId);

    // Automatically generate a contract awaiting signature
    const updatedProfile = await clientProfilesRepository.findByUserId(userId);
    if (!updatedProfile?.contract) {
      await contractsService.createForUser(userId, updatedProfile!.id);
    }

    logger.info({ userId }, 'Client profile completed');
    return clientProfilesRepository.findByUserId(userId);
  },

  /**
   * Instructor fills physical assessment data after onboarding session.
   */
  async updateAssessment(
    clientUserId: string,
    data: PhysicalAssessmentDto,
    instructorUserId: string,
  ) {
    const profile = await clientProfilesRepository.findByUserId(clientUserId);
    if (!profile) throw new NotFoundError('Client profile not found');

    return clientProfilesRepository.updateAssessment(
      clientUserId,
      data,
      instructorUserId,
    );
  },

  async listIncomplete(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return clientProfilesRepository.listIncomplete(skip, limit);
  },
};
