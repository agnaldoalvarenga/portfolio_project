interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter. In-memory and per-instance — fine as a first line
 * of defense; production puts Cloudflare/Upstash in front for global limits.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { allowed: boolean; remaining: number } {
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  b.count++;
  return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count) };
}

/** Test/maintenance helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
