import type { RateLimitStore } from "@/lib/chat/rateLimit.ts";

const ADMIN_USER = "owner";
const ADMIN_PASSWORD = "correct-horse-battery-staple";

let fakeStore: { check: ReturnType<typeof vi.fn> };

vi.mock("@/lib/chat/rateLimit.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/chat/rateLimit.ts")>();
  return {
    ...actual,
    createUpstashRateLimitStore: (): RateLimitStore =>
      fakeStore as unknown as RateLimitStore,
  };
});

function makeLoginRequest(username: string, password: string): Request {
  const body = new URLSearchParams({ username, password });
  return new Request("http://localhost/admin/login/submit", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }) as unknown as Request;
}

describe("POST /admin/login/submit", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USER", ADMIN_USER);
    vi.stubEnv("ADMIN_PASSWORD", ADMIN_PASSWORD);
    fakeStore = { check: vi.fn().mockResolvedValue({ allowed: true }) };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets a signed session cookie and redirects to /admin on valid credentials", async () => {
    const { POST } = await import("./route.ts");
    const response = await POST(makeLoginRequest(ADMIN_USER, ADMIN_PASSWORD) as never);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/admin");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("admin_session=");
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
    expect(setCookie).toContain("Path=/admin");
  });

  it("redirects back to the login form without a cookie on invalid credentials", async () => {
    const { POST } = await import("./route.ts");
    const response = await POST(makeLoginRequest(ADMIN_USER, "wrong-password") as never);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/admin/login?error=1",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("responds 429 when the rate limit is exceeded", async () => {
    fakeStore.check.mockResolvedValue({ allowed: false });
    const { POST } = await import("./route.ts");
    const response = await POST(makeLoginRequest(ADMIN_USER, ADMIN_PASSWORD) as never);

    expect(response.status).toBe(429);
  });

  it("proceeds to the credential check when the rate-limit backend errors (fail-open)", async () => {
    fakeStore.check.mockRejectedValue(new Error("backend down"));
    const { POST } = await import("./route.ts");
    const response = await POST(makeLoginRequest(ADMIN_USER, ADMIN_PASSWORD) as never);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/admin");
  });
});
