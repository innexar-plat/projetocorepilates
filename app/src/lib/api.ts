import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { incrementMetric } from '@/lib/metrics';
import { randomUUID } from 'crypto';

function statusLabel(statusCode: number): string {
  const labels: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return labels[statusCode] ?? 'Internal Server Error';
}

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>): NextResponse {
  if (meta) {
    return NextResponse.json({ data, meta }, { status });
  }
  return NextResponse.json({ data }, { status });
}

export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): NextResponse {
  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function apiError(error: unknown, forceStatus?: number): NextResponse {
  const requestId = randomUUID();

  if (error instanceof AppError) {
    incrementMetric(`api.errors.${error.statusCode}`);
    if (error.statusCode >= 500) {
      logger.error({ requestId, err: error }, 'Server error');
    } else {
      logger.warn({ requestId, statusCode: error.statusCode, message: error.message }, 'Client error');
    }

    return NextResponse.json(
      {
        requestId,
        statusCode: error.statusCode,
        error: error.error,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: forceStatus ?? error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    incrementMetric('api.errors.400');
    logger.warn({ requestId, issues: error.issues }, 'Validation error');
    return NextResponse.json(
      {
        requestId,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  if (forceStatus !== undefined) {
    incrementMetric(`api.errors.${forceStatus}`);
    const isServer = forceStatus >= 500;
    if (isServer) {
      logger.error({ requestId, statusCode: forceStatus, err: error }, 'Server error');
    } else {
      logger.warn({ requestId, statusCode: forceStatus, err: error }, 'Client error');
    }

    const safeMessage =
      error instanceof Error
        ? error.message
        : isServer
          ? 'An unexpected error occurred'
          : 'Request failed';

    return NextResponse.json(
      {
        requestId,
        statusCode: forceStatus,
        error: statusLabel(forceStatus),
        message: safeMessage,
      },
      { status: forceStatus },
    );
  }

  // Unknown / unexpected error — never leak internals in production
  const isProd = process.env.NODE_ENV === 'production';
  incrementMetric('api.errors.500');
  logger.error({ requestId, err: error }, 'Unexpected error');

  return NextResponse.json(
    {
      requestId,
      statusCode: 500,
      error: 'Internal Server Error',
      message: isProd ? 'An unexpected error occurred' : String(error),
    },
    { status: forceStatus ?? 500 },
  );
}

export function parsePagination(dto: { page?: number; limit?: number }): {
  page: number;
  limit: number;
  skip: number;
  take: number;
} {
  const page = Math.max(1, dto.page ?? 1);
  const limit = Math.min(100, Math.max(1, dto.limit ?? 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

/**
 * Convenience helper for explicit client-facing errors (no thrown exception needed).
 * Example: apiClientError(401, 'Unauthorized', 'Authentication required')
 */
export function apiClientError(
  statusCode: number,
  error: string,
  message: string,
  details?: unknown[],
): NextResponse {
  return NextResponse.json(
    {
      requestId: randomUUID(),
      statusCode,
      error,
      message,
      ...(details ? { details } : {}),
    },
    { status: statusCode },
  );
}

/**
 * Drop-in catch-block handler that delegates to apiError for all thrown values.
 */
export function handleApiError(error: unknown): NextResponse {
  return apiError(error);
}
