import { checkRateLimit } from "./rateLimit.ts";
import type { RateLimitStore } from "./rateLimit.ts";

function makeInMemoryStore(): RateLimitStore {
  const counts = new Map<string, number>();
  return {
    async check(key, limit) {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return { allowed: count <= limit };
    },
  };
}

function makeThrowingStore(): RateLimitStore {
  return {
    async check() {
      throw new Error("store unavailable");
    },
  };
}

describe("checkRateLimit", () => {
  it("allows requests while under the configured limit", async () => {
    const store = makeInMemoryStore();

    const result = await checkRateLimit(store, "ip:1.2.3.4", 3, 300);

    expect(result.allowed).toBe(true);
  });

  it("rejects once a key reaches the limit within the window", async () => {
    const store = makeInMemoryStore();
    await checkRateLimit(store, "ip:1.2.3.4", 3, 300);
    await checkRateLimit(store, "ip:1.2.3.4", 3, 300);
    await checkRateLimit(store, "ip:1.2.3.4", 3, 300);

    const result = await checkRateLimit(store, "ip:1.2.3.4", 3, 300);

    expect(result.allowed).toBe(false);
  });

  it("tracks per-IP and per-session keys independently", async () => {
    const store = makeInMemoryStore();
    await checkRateLimit(store, "ip:1.2.3.4", 3, 300);
    await checkRateLimit(store, "ip:1.2.3.4", 3, 300);
    await checkRateLimit(store, "ip:1.2.3.4", 3, 300);

    const ipResult = await checkRateLimit(store, "ip:1.2.3.4", 3, 300);
    const sessionResult = await checkRateLimit(
      store,
      "session:abc-123",
      3,
      300,
    );

    expect(ipResult.allowed).toBe(false);
    expect(sessionResult.allowed).toBe(true);
  });

  it("fails open (allows the request) when the store throws, without an unhandled rejection", async () => {
    const store = makeThrowingStore();

    const result = await checkRateLimit(store, "ip:1.2.3.4", 3, 300);

    expect(result.allowed).toBe(true);
  });
});
