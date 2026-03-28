interface IdempotencyEntry {
  expiresAt: number;
}

const idempotencyStore = new Map<string, IdempotencyEntry>();

const parsedTtl = Number(process.env.STRIPE_WEBHOOK_IDEMPOTENCY_TTL_MS);
const DEFAULT_TTL_MS = Number.isFinite(parsedTtl) && parsedTtl > 0
  ? parsedTtl
  : 24 * 60 * 60 * 1000;

// Cleanup expired keys every 10 minutes.
const idempotencyCleanupTimer = setInterval(() => {
  const now = Date.now();
  idempotencyStore.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      idempotencyStore.delete(key);
    }
  });
}, 10 * 60 * 1000);

if (typeof idempotencyCleanupTimer.unref === 'function') {
  idempotencyCleanupTimer.unref();
}

export function registerIdempotencyKey(key: string, ttlMs = DEFAULT_TTL_MS): boolean {
  const now = Date.now();
  const existing = idempotencyStore.get(key);

  if (existing && existing.expiresAt > now) {
    return false;
  }

  idempotencyStore.set(key, { expiresAt: now + ttlMs });
  return true;
}

export function clearIdempotencyStore(): void {
  idempotencyStore.clear();
}
