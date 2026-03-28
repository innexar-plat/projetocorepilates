/**
 * Generates the full legal contract text for Core Pilates.
 *
 * The content is snapshotted at signing time so any future changes
 * to the template do not affect previously signed contracts.
 */

const CONTRACT_VERSION = '1.0';

export interface ContractContext {
  clientName: string;
  clientEmail: string;
  studioName?: string;
  date: string; // ISO date string
}

export function generateContractContent(ctx: ContractContext): string {
  const studio = ctx.studioName ?? 'Core Pilates';
  const date = new Date(ctx.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
CORE PILATES — CLIENT SERVICES AGREEMENT & LIABILITY WAIVER
Version ${CONTRACT_VERSION} | ${date}

This agreement is entered into between ${studio} ("Studio") and ${ctx.clientName} ("Client", email: ${ctx.clientEmail}).

══════════════════════════════════════════════════════
1. INFORMED CONSENT & ASSUMPTION OF RISK
══════════════════════════════════════════════════════

The Client acknowledges that participation in Pilates and fitness activities involves inherent physical risks,
including but not limited to: muscular strains, ligament or tendon injuries, cardiovascular events, and other
health-related incidents.

The Client voluntarily chooses to participate in the Studio's programmes, fully understanding and accepting
these risks. The Client represents that they are in adequate physical condition to participate in fitness
activities and that they have truthfully disclosed all relevant medical information in their health intake form.

The Client acknowledges that the Studio's instructors are fitness professionals, not medical practitioners,
and that Pilates instruction does not constitute medical advice or treatment.

══════════════════════════════════════════════════════
2. RELEASE AND WAIVER OF LIABILITY
══════════════════════════════════════════════════════

In consideration of the Studio providing Pilates instruction and services, the Client, to the fullest extent
permitted by applicable law, hereby releases, waives, discharges, and covenants not to sue ${studio}, its
owners, directors, employees, agents, contractors, instructors, and representatives (collectively, "Released
Parties") from any and all claims, demands, damages, losses, liabilities, costs, or expenses of any kind
("Claims") arising out of or related to the Client's participation in activities at the Studio.

This release includes, without limitation, Claims arising from:
  (a) Negligence of the Released Parties;
  (b) Defects in equipment, premises, or services;
  (c) Actions or inactions of other participants;
  (d) Any other cause whatsoever.

The Client agrees to indemnify and hold harmless the Released Parties from and against any Claims brought by
third parties arising from or related to the Client's participation in Studio activities.

══════════════════════════════════════════════════════
3. HEALTH DECLARATION
══════════════════════════════════════════════════════

The Client certifies that all information provided in the health intake form is true, accurate, and complete.
The Client understands that:
  (a) Providing false or misleading health information constitutes a material breach of this agreement;
  (b) The Studio relies on this information to provide safe instruction;
  (c) Any injury or harm resulting from undisclosed health conditions is the sole responsibility of the Client.

The Client agrees to immediately notify an instructor of any change in their health status, new medications,
injuries, or any condition that may affect their ability to safely participate in Pilates activities.

══════════════════════════════════════════════════════
4. EMERGENCY MEDICAL AUTHORIZATION
══════════════════════════════════════════════════════

In the event of a medical emergency, the Client authorizes the Studio and its staff to:
  (a) Call emergency medical services (911 or local equivalent);
  (b) Administer first aid to the extent of staff training and ability;
  (c) Share the Client's emergency contact and relevant health information with first responders.

The Client acknowledges that the Studio staff are not trained medical professionals and that first aid
provided is done in good faith. The Released Parties shall not be liable for any medical decisions made
in good faith during an emergency.

══════════════════════════════════════════════════════
5. PHOTOGRAPHY AND VIDEO CONSENT
══════════════════════════════════════════════════════

The Client's consent regarding photography and video recording has been recorded separately in their profile.
If the Client has provided consent, the Studio is authorized to use images or footage of the Client for
promotional, educational, or social media purposes without additional compensation.

The Client may withdraw this consent at any time by written notice to the Studio, and such withdrawal will
apply to future uses only and will not require removal of content already published.

══════════════════════════════════════════════════════
6. DATA PROTECTION AND PRIVACY
══════════════════════════════════════════════════════

The Studio collects and processes the Client's personal data (including health information) for the purposes
of providing safe pilates instruction, managing the client relationship, and complying with legal obligations.

The Client's data is processed in accordance with applicable data protection laws. Health data is classified
as sensitive data and is protected with appropriate technical and organizational measures. Data is not sold
or shared with third parties except as required to provide the Studio's services (e.g., payment processors)
or as required by law.

The Client has the right to access, correct, or request deletion of their personal data, subject to the
Studio's legal obligation to retain certain records.

══════════════════════════════════════════════════════
7. CANCELLATION AND REFUND POLICY
══════════════════════════════════════════════════════

Class cancellations must be made at least 24 hours in advance to avoid losing the credit for that session.
Subscription plan changes take effect at the start of the next billing cycle. Refunds are issued at the
Studio's discretion and in accordance with applicable consumer protection laws.

══════════════════════════════════════════════════════
8. GOVERNING LAW AND DISPUTE RESOLUTION
══════════════════════════════════════════════════════

This agreement shall be governed by the laws of the jurisdiction in which the Studio operates. Any disputes
arising from this agreement shall first be addressed through good-faith negotiation, and thereafter through
binding arbitration or the courts of competent jurisdiction.

══════════════════════════════════════════════════════
9. ACKNOWLEDGEMENT
══════════════════════════════════════════════════════

By signing below (electronically), the Client acknowledges that they have read this agreement in its entirety,
understand its contents, and freely and voluntarily agree to be bound by its terms.

The Client confirms that they are of legal age (18 years or older), or that a parent/guardian has signed on
their behalf.

Client: ${ctx.clientName}
Email:  ${ctx.clientEmail}
Date:   ${date}

[DIGITAL SIGNATURE BLOCK — see signature record]
`.trim();
}

export { CONTRACT_VERSION };
