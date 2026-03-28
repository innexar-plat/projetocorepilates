import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi';

/**
 * GET /api/docs
 * Returns the OpenAPI 3.0 JSON specification.
 * Public endpoint — no authentication required.
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
