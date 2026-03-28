import { z } from 'zod';

// ─── Create / Update Client Profile ─────────────────────────────────────────

export const clientProfileSchema = z.object({
  // Personal Info
  dateOfBirth: z
    .string()
    .date('Must be a valid date (YYYY-MM-DD)')
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),

  // Address
  street: z.string().max(200).optional(),
  complement: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().length(2, 'Use ISO 3166-1 alpha-2 code (e.g. US)').default('US'),

  // Emergency Contact — required for profile completion
  emergencyName: z.string().min(2).max(100).optional(),
  emergencyPhone: z
    .string()
    .max(20)
    .regex(/^[+\d\s\-().]+$/, 'Invalid phone number')
    .optional(),
  emergencyRelation: z.string().max(50).optional(),

  // Health History
  allergies: z.string().max(2000).optional(),
  medications: z.string().max(2000).optional(),
  preExistingConditions: z.string().max(2000).optional(),
  surgeries: z.string().max(2000).optional(),

  // PAR-Q — Physical Activity Readiness Questionnaire
  parqHeartCondition: z.boolean().default(false),
  parqChestPainActivity: z.boolean().default(false),
  parqChestPainRest: z.boolean().default(false),
  parqDizziness: z.boolean().default(false),
  parqBoneJoint: z.boolean().default(false),
  parqBloodPressureMeds: z.boolean().default(false),
  parqOtherReason: z.boolean().default(false),
  parqNotes: z.string().max(2000).optional(),

  // Physician (required if any PAR-Q answer is true)
  physicianClearance: z.boolean().default(false),
  physicianName: z.string().max(100).optional(),
  physicianPhone: z.string().max(20).optional(),

  // Goals
  goals: z.string().max(2000).optional(),

  // Consents — all three must be true to complete profile
  liabilityWaiverAccepted: z.boolean().default(false),
  photoVideoConsent: z.boolean().default(false),
  dataProcessingConsent: z.boolean().default(false),
});

export type ClientProfileDto = z.infer<typeof clientProfileSchema>;

// ─── Validation: require physician when any PAR-Q is positive ───────────────

export const clientProfileCompleteSchema = clientProfileSchema.superRefine(
  (data, ctx) => {
    const parqPositive =
      data.parqHeartCondition ||
      data.parqChestPainActivity ||
      data.parqChestPainRest ||
      data.parqDizziness ||
      data.parqBoneJoint ||
      data.parqBloodPressureMeds ||
      data.parqOtherReason;

    if (parqPositive && !data.physicianClearance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['physicianClearance'],
        message:
          'Physician clearance is required when any PAR-Q question is answered YES',
      });
    }

    if (!data.emergencyName || !data.emergencyPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emergencyName'],
        message: 'Emergency contact name and phone are required',
      });
    }

    if (!data.liabilityWaiverAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['liabilityWaiverAccepted'],
        message: 'You must accept the liability waiver to complete registration',
      });
    }

    if (!data.dataProcessingConsent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataProcessingConsent'],
        message: 'Data processing consent is required',
      });
    }
  },
);

// ─── Physical Assessment (instructor-only) ───────────────────────────────────

export const physicalAssessmentSchema = z.object({
  fitnessLevel: z.enum(['SEDENTARY', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  goals: z.string().max(2000).optional(),
  physicalAssessmentNotes: z.string().max(5000).optional(),
});

export type PhysicalAssessmentDto = z.infer<typeof physicalAssessmentSchema>;
