type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  key: string,
  options: { max: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    const nextRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    buckets.set(key, nextRecord);
    return {
      allowed: true,
      remaining: Math.max(0, options.max - 1),
      resetAt: nextRecord.resetAt,
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    allowed: current.count <= options.max,
    remaining: Math.max(0, options.max - current.count),
    resetAt: current.resetAt,
  };
}
