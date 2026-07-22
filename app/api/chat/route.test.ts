import { POST } from "./route.ts";
import type { RateLimitStore } from "../../../lib/chat/rateLimit.ts";

// These tests only exercise the request-validation path, which fails before
// any client is constructed or any network call is made — safe to run with
// no OPENAI_API_KEY present, no real API cost. The streaming success path is
// verified live via curl (see this change's tasks.md §4), not here.
describe("POST /api/chat validation", () => {
  it("returns 400 for a malformed JSON body, without constructing any client", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for a missing question field", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for an empty question", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ question: "   " }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for an over-length question", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ question: "a".repeat(501) }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

const embeddingsCreateMock = vi.fn();

vi.mock("openai", () => ({
  default: class FakeOpenAI {
    embeddings = { create: embeddingsCreateMock };
  },
}));

vi.mock("../../../lib/rag/retrieve.ts", () => ({
  loadIndex: () => [],
  retrieveTopK: () => [],
}));

vi.mock("../../../lib/rag/active-provider.ts", () => ({
  createActiveProvider: () => ({
    name: "fake",
    model: "fake-model",
    generate: async () => ({ answer: "ok", inputTokens: 1, outputTokens: 1 }),
    async *generateStream() {
      yield "ok";
    },
  }),
}));

let fakeStore: { check: ReturnType<typeof vi.fn> };

vi.mock("../../../lib/chat/rateLimit.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/chat/rateLimit.ts")>();
  return {
    ...actual,
    createUpstashRateLimitStore: (): RateLimitStore =>
      fakeStore as unknown as RateLimitStore,
  };
});

function makeChatRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("POST /api/chat rate limiting", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "fake-key");
    embeddingsCreateMock.mockReset();
    embeddingsCreateMock.mockResolvedValue({ data: [{ embedding: [1, 0, 0] }] });
    fakeStore = { check: vi.fn().mockResolvedValue({ allowed: true }) };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("proceeds normally when the IP is under the per-IP rate limit", async () => {
    const response = await POST(
      makeChatRequest(
        { question: "Who is Jose?" },
        { "x-forwarded-for": "1.2.3.4" },
      ),
    );

    expect(response.status).not.toBe(429);
    expect(fakeStore.check).toHaveBeenCalled();
  });

  it("rejects with 429 and a contactable fallback when the per-IP limit is exceeded", async () => {
    fakeStore.check.mockResolvedValue({ allowed: false });

    const response = await POST(
      makeChatRequest(
        { question: "Who is Jose?" },
        { "x-forwarded-for": "1.2.3.4" },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toMatchObject({
      error: "rate_limited",
      contact: { email: expect.any(String), scheduling: expect.any(String) },
    });
    expect(embeddingsCreateMock).not.toHaveBeenCalled();
  });

  it("rejects with 429 when the per-session limit is exceeded via the session header", async () => {
    fakeStore.check.mockImplementation(async (key: string) => ({
      allowed: !key.startsWith("session:"),
    }));

    const response = await POST(
      makeChatRequest(
        { question: "Who is Jose?" },
        { "x-forwarded-for": "1.2.3.4", "x-chat-session-id": "session-abc" },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe("rate_limited");
  });

  it("still enforces the per-IP limit when no session header is sent", async () => {
    fakeStore.check.mockResolvedValue({ allowed: false });

    const response = await POST(
      makeChatRequest(
        { question: "Who is Jose?" },
        { "x-forwarded-for": "1.2.3.4" },
      ),
    );

    expect(response.status).toBe(429);
  });
});
