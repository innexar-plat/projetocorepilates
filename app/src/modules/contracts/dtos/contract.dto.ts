import { z } from 'zod';

export const signContractSchema = z.object({
  /**
   * The client types their full legal name as their digital signature.
   * Typed signatures are legally valid in most jurisdictions (ESIGN Act, eIDAS).
   */
  signatureData: z
    .string()
    .min(3, 'Please type your full legal name as your signature')
    .max(200),
});

export type SignContractDto = z.infer<typeof signContractSchema>;
