import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  const startMs = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startMs;

    return NextResponse.json(
      {
        status: 'ok',
        db: 'ok',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error({ error }, 'Health check: database unreachable');

    return NextResponse.json(
      {
        status: 'degraded',
        db: 'error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
