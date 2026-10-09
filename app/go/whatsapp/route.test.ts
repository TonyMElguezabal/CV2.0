import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route.ts";
import type { RateLimitStore } from "../../../lib/chat/rateLimit.ts";

const TEST_NUMBER = "15551234567";

let fakeRateLimitStore: { check: ReturnType<typeof vi.fn> };

vi.mock("../../../lib/chat/rateLimit.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/chat/rateLimit.ts")>();
  return {
    ...actual,
    createUpstashRateLimitStore: (): RateLimitStore =>
      fakeRateLimitStore as unknown as RateLimitStore,
  };
});

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/go/whatsapp", { headers });
}

beforeEach(() => {
  fakeRateLimitStore = { check: vi.fn().mockResolvedValue({ allowed: true }) };
  vi.stubEnv("WHATSAPP_NUMBER", TEST_NUMBER);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /go/whatsapp — valid configuration", () => {
  it("returns 302 to wa.me with the configured digits", async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(`https://wa.me/${TEST_NUMBER}`);
  });

  it("sets no-store caching and a noindex robots header", async () => {
    const response = await GET(makeRequest());

    expect(response.headers.get("Cache-Control")).toMatch(/no-store/);
    expect(response.headers.get("X-Robots-Tag")).toMatch(/noindex/);
  });

  it("keys its rate limit under its own go-whatsapp namespace", async () => {
    await GET(makeRequest({ "x-forwarded-for": "203.0.113.7" }));

    const [key] = fakeRateLimitStore.check.mock.calls[0] as [string];
    expect(key.startsWith("go-whatsapp:")).toBe(true);
    expect(key).toContain("203.0.113.7");
  });
});

describe("GET /go/whatsapp — fail closed on a missing or malformed number", () => {
  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["with a plus sign and spaces", "+52 55 1234 5678"],
    ["too short", "1234567"],
    ["too long", "1234567890123456"],
    ["containing letters", "1555ABC4567"],
  ])("returns 503 with no Location when the number is %s", async (_label, value) => {
    if (value === undefined) delete process.env.WHATSAPP_NUMBER;
    else vi.stubEnv("WHATSAPP_NUMBER", value);

    const response = await GET(makeRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("Location")).toBeNull();
  });
});

describe("GET /go/whatsapp — rate limiting", () => {
  it("returns 429 with no Location once the limit is exceeded", async () => {
    fakeRateLimitStore.check.mockResolvedValue({ allowed: false });

    const response = await GET(makeRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("Location")).toBeNull();
  });

  it("fails open: a throwing rate-limit store still redirects", async () => {
    fakeRateLimitStore.check.mockRejectedValue(new Error("upstash down"));

    const response = await GET(makeRequest());

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(`https://wa.me/${TEST_NUMBER}`);
  });
});

describe("GET /go/whatsapp — the number is never logged", () => {
  it("writes no console output containing the number or the target", async () => {
    const spies = [
      vi.spyOn(console, "log"),
      vi.spyOn(console, "info"),
      vi.spyOn(console, "warn"),
      vi.spyOn(console, "error"),
    ];

    await GET(makeRequest());

    for (const spy of spies) {
      const written = JSON.stringify(spy.mock.calls);
      expect(written).not.toContain(TEST_NUMBER);
      expect(written).not.toContain("wa.me");
    }
  });
});
