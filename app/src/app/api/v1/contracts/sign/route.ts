import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { contractsService } from '@/modules/contracts/services/contracts.service';
import { signContractSchema } from '@/modules/contracts/dtos/contract.dto';
import { apiSuccess, apiError } from '@/lib/api';

/**
 * POST /api/v1/contracts/sign
 * Signs the authenticated user's contract.
 *
 * Captures:
 *  - signatureData  : typed full legal name (body)
 *  - ipAddress      : from x-forwarded-for or remoteAddress header (legal evidence)
 *  - userAgent      : from User-Agent header (legal evidence)
 *  - timestamp      : recorded server-side at signing moment
 *
 * The signed contract is archived asynchronously to MinIO as a text file.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const dto = signContractSchema.parse(body);

    // Capture legal evidence from request headers
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';
    const userAgent = req.headers.get('user-agent') ?? 'unknown';

    const signed = await contractsService.sign(
      session.user.id,
      dto,
      ipAddress,
      userAgent,
    );

    return apiSuccess({ data: signed });
  } catch (err) {
    return apiError(err);
  }
}
