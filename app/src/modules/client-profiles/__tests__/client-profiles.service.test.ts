import { clientProfilesService } from '../services/client-profiles.service';
import { clientProfilesRepository } from '../repositories/client-profiles.repository';
import { contractsService } from '@/modules/contracts/services/contracts.service';
import { NotFoundError, ValidationError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../repositories/client-profiles.repository');
jest.mock('@/modules/contracts/services/contracts.service');

const repoMock = jest.mocked(clientProfilesRepository);
const contractsMock = jest.mocked(contractsService);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const userId = 'user-001';

const minimalProfile = {
  id: 'profile-001',
  userId,
  isComplete: false,
  completedAt: null,
  contract: null,
  dateOfBirth: null,
  gender: null,
  street: null,
  complement: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  emergencyName: null,
  emergencyPhone: null,
  emergencyRelation: null,
  allergies: null,
  medications: null,
  preExistingConditions: null,
  surgeries: null,
  parqHeartCondition: false,
  parqChestPainActivity: false,
  parqChestPainRest: false,
  parqDizziness: false,
  parqBoneJoint: false,
  parqBloodPressureMeds: false,
  parqOtherReason: false,
  parqNotes: null,
  physicianClearance: false,
  physicianName: null,
  physicianPhone: null,
  fitnessLevel: null,
  goals: null,
  physicalAssessmentNotes: null,
  assessedAt: null,
  assessedByUserId: null,
  liabilityWaiverAccepted: false,
  photoVideoConsent: false,
  dataProcessingConsent: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const completeData = {
  dateOfBirth: '1990-05-15',
  gender: 'FEMALE' as const,
  street: 'Rua das Flores, 123',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
  country: 'BR',
  emergencyName: 'Maria Silva',
  emergencyPhone: '+5511987654321',
  emergencyRelation: 'Mãe',
  parqHeartCondition: false,
  parqChestPainActivity: false,
  parqChestPainRest: false,
  parqDizziness: false,
  parqBoneJoint: false,
  parqBloodPressureMeds: false,
  parqOtherReason: false,
  physicianClearance: false,
  liabilityWaiverAccepted: true,
  dataProcessingConsent: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('clientProfilesService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── getByUserId ────────────────────────────────────────────────────────────

  describe('getByUserId', () => {
    it('returns profile when it exists', async () => {
      repoMock.findByUserId.mockResolvedValue(minimalProfile as never);

      const result = await clientProfilesService.getByUserId(userId);

      expect(result).toEqual(minimalProfile);
      expect(repoMock.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('throws NotFoundError when profile does not exist', async () => {
      repoMock.findByUserId.mockResolvedValue(null);

      await expect(clientProfilesService.getByUserId(userId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ── upsert ─────────────────────────────────────────────────────────────────

  describe('upsert', () => {
    it('creates profile when it does not exist', async () => {
      repoMock.findByUserId.mockResolvedValue(null);
      repoMock.create.mockResolvedValue({ ...minimalProfile, ...completeData } as never);

      const result = await clientProfilesService.upsert(userId, completeData as never);

      expect(repoMock.create).toHaveBeenCalledWith(userId, completeData);
      expect(repoMock.update).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('updates profile when it already exists', async () => {
      repoMock.findByUserId.mockResolvedValue(minimalProfile as never);
      const updated = { ...minimalProfile, city: 'Rio de Janeiro' };
      repoMock.update.mockResolvedValue(updated as never);

      const result = await clientProfilesService.upsert(userId, { city: 'Rio de Janeiro' } as never);

      expect(repoMock.update).toHaveBeenCalledWith(userId, { city: 'Rio de Janeiro' });
      expect(repoMock.create).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });
  });

  // ── complete ──────────────────────────────────────────────────────────────

  describe('complete', () => {
    const completedProfile = {
      ...minimalProfile,
      ...completeData,
      isComplete: true,
      completedAt: new Date(),
    };

    it('marks profile complete and creates contract when all required fields present', async () => {
      repoMock.findByUserId
        .mockResolvedValueOnce(null) // upsert: create check
        .mockResolvedValueOnce({ ...completedProfile, contract: null, id: 'profile-001' } as never); // after markComplete

      repoMock.create.mockResolvedValue(completedProfile as never);
      repoMock.markComplete.mockResolvedValue(completedProfile as never);
      repoMock.findByUserId.mockResolvedValue(completedProfile as never);

      contractsMock.createForUser.mockResolvedValue({ id: 'contract-001' } as never);

      await clientProfilesService.complete(userId, completeData as never);

      expect(repoMock.markComplete).toHaveBeenCalledWith(userId);
    });

    it('throws ValidationError when emergency contact is missing', async () => {
      const incompleteData = { ...completeData, emergencyName: undefined, emergencyPhone: undefined };

      await expect(
        clientProfilesService.complete(userId, incompleteData as never),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when liability waiver is not accepted', async () => {
      const noWaiver = { ...completeData, liabilityWaiverAccepted: false };

      await expect(
        clientProfilesService.complete(userId, noWaiver as never),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when PAR-Q positive but physician clearance absent', async () => {
      const parqPositive = {
        ...completeData,
        parqHeartCondition: true,
        physicianClearance: false,
      };

      await expect(
        clientProfilesService.complete(userId, parqPositive as never),
      ).rejects.toThrow(ValidationError);
    });

    it('does not create duplicate contract when contract already exists', async () => {
      const profileWithContract = {
        ...completedProfile,
        contract: { id: 'contract-001', isSigned: false, signedAt: null },
      };

      repoMock.findByUserId
        .mockResolvedValueOnce(profileWithContract as never) // upsert: update branch
        .mockResolvedValueOnce(profileWithContract as never); // after markComplete

      repoMock.update.mockResolvedValue(profileWithContract as never);
      repoMock.markComplete.mockResolvedValue(profileWithContract as never);

      await clientProfilesService.complete(userId, completeData as never);

      expect(contractsMock.createForUser).not.toHaveBeenCalled();
    });

    it('throws when profile disappears after markComplete', async () => {
      repoMock.findByUserId
        .mockResolvedValueOnce(minimalProfile as never) // upsert update branch
        .mockResolvedValueOnce(null); // after markComplete

      repoMock.update.mockResolvedValue({ ...minimalProfile, ...completeData } as never);
      repoMock.markComplete.mockResolvedValue({ ...minimalProfile, ...completeData } as never);

      await expect(clientProfilesService.complete(userId, completeData as never)).rejects.toThrow();
      expect(contractsMock.createForUser).not.toHaveBeenCalled();
    });
  });

  // ── updateAssessment ──────────────────────────────────────────────────────

  describe('updateAssessment', () => {
    const assessmentData = {
      fitnessLevel: 'BEGINNER' as const,
      goals: 'Improve flexibility and core strength',
      physicalAssessmentNotes: 'Good posture, slight lordosis',
    };

    it('updates assessment when profile exists', async () => {
      const instructorId = 'instructor-001';
      repoMock.findByUserId.mockResolvedValue(minimalProfile as never);
      repoMock.updateAssessment.mockResolvedValue({ ...minimalProfile, ...assessmentData } as never);

      const result = await clientProfilesService.updateAssessment(
        userId,
        assessmentData,
        instructorId,
      );

      expect(repoMock.updateAssessment).toHaveBeenCalledWith(userId, assessmentData, instructorId);
      expect(result).toBeDefined();
    });

    it('throws NotFoundError when profile does not exist', async () => {
      repoMock.findByUserId.mockResolvedValue(null);

      await expect(
        clientProfilesService.updateAssessment(userId, assessmentData, 'instructor-001'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ── listIncomplete ─────────────────────────────────────────────────────────

  describe('listIncomplete', () => {
    it('uses default pagination values when no args are passed', async () => {
      repoMock.listIncomplete.mockResolvedValue([] as never);

      await clientProfilesService.listIncomplete();

      expect(repoMock.listIncomplete).toHaveBeenCalledWith(0, 20);
    });

    it('delegates pagination to repository', async () => {
      repoMock.listIncomplete.mockResolvedValue([] as never);

      await clientProfilesService.listIncomplete(2, 10);

      expect(repoMock.listIncomplete).toHaveBeenCalledWith(10, 10); // skip = (2-1)*10 = 10
    });
  });
});
