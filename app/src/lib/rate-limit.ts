/**
 * Simple sliding-window in-memory rate limiter.
 * For multi-instance deployments, replace with a Redis-backed implementation.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Cleans up expired entries every 5 minutes */
const rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) keysToDelete.push(key);
  });
  keysToDelete.forEach((key) => store.delete(key));
}, 5 * 60 * 1000);

if (typeof rateLimitCleanupTimer.unref === 'function') {
  rateLimitCleanupTimer.unref();
}

/**
 * Returns `true` when the request is allowed, `false` when the limit is exceeded.
 *
 * @param key      Unique identifier (e.g. `ip:127.0.0.1` or `email:foo@bar.com`)
 * @param limit    Maximum number of requests in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

/** Convenience: 5 requests per minute (public endpoints like /register, /leads) */
export function checkPublicRateLimit(ip: string): boolean {
  return rateLimit(`public:${ip}`, 5, 60_000);
}

/** Convenience: 10 login attempts per 15 minutes per IP */
export function checkLoginRateLimit(ip: string): boolean {
  return rateLimit(`login:${ip}`, 10, 15 * 60_000);
}
