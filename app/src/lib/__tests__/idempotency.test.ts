import { clearIdempotencyStore, registerIdempotencyKey } from '@/lib/idempotency';

describe('idempotency', () => {
  beforeEach(() => {
    clearIdempotencyStore();
  });

  it('accepts first key registration', () => {
    expect(registerIdempotencyKey('stripe:evt_1')).toBe(true);
  });

  it('rejects duplicate key during ttl window', () => {
    expect(registerIdempotencyKey('stripe:evt_1')).toBe(true);
    expect(registerIdempotencyKey('stripe:evt_1')).toBe(false);
  });

  it('accepts key again after ttl expires', async () => {
    expect(registerIdempotencyKey('stripe:evt_1', 1)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(registerIdempotencyKey('stripe:evt_1', 1)).toBe(true);
  });
});
