import { apiError } from '@/lib/api';
import { ValidationError } from '@/lib/errors';
import { resetMetrics, getMetricsSnapshot } from '@/lib/metrics';

describe('apiError', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('keeps body and http status consistent when forceStatus is provided', async () => {
    const response = apiError(new Error('Authentication required'), 401);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Authentication required');
  });

  it('returns AppError contract and metrics', async () => {
    const response = apiError(new ValidationError('Validation failed'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(getMetricsSnapshot()['api.errors.400']).toBe(1);
  });
});
