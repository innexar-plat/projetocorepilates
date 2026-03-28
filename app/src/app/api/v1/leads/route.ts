import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { leadsService } from '@/modules/leads/services/leads.service';
import { createLeadSchema } from '@/modules/leads/dtos/lead.dto';
import { apiCreated, apiPaginated, apiError } from '@/lib/api';
import { checkPublicRateLimit } from '@/lib/rate-limit';

// POST /api/v1/leads — public endpoint for contact form / landing page capture
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkPublicRateLimit(ip)) {
    return apiError(new Error('Too Many Requests'), 429);
  }

  try {
    const body = await req.json();
    const dto = createLeadSchema.parse(body);
    const lead = await leadsService.capture(dto);
    return apiCreated({ data: { id: lead.id } }); // return only id to avoid exposing full record
  } catch (err) {
    return apiError(err);
  }
}

// GET /api/v1/leads — admin only
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return apiError(new Error('Forbidden'), 403);
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const dto = {
      page,
      limit,
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    } as any;

    const result = await leadsService.list(dto);
    return apiPaginated(result.data, result.total, page, limit);
  } catch (err) {
    return apiError(err);
  }
}
