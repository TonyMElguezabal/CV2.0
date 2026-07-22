import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export interface RateLimitStore {
  check(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean }>;
}

// Fails open: a rate-limit store outage should not take down chat entirely.
export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean }> {
  try {
    return await store.check(key, limit, windowSeconds);
  } catch {
    return { allowed: true };
  }
}

export function createUpstashRateLimitStore(): RateLimitStore {
  const redis = Redis.fromEnv();

  return {
    async check(key, limit, windowSeconds) {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      });
      const { success } = await ratelimit.limit(key);
      return { allowed: success };
    },
  };
}
