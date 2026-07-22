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
  retrieveTopK: () => [
    {
      id: "a",
      text: "Fixture content.",
      source: "experience",
      chapterId: "envato",
      anchor: "#envato",
      embedding: [1, 0, 0],
    },
  ],
  // Above generate.ts's RELEVANCE_THRESHOLD so the off-topic guard (5.4)
  // never short-circuits these route-level tests.
  cosineSimilarity: () => 1,
}));

let fakeGenerateStream: () => AsyncGenerator<string>;

vi.mock("../../../lib/rag/active-provider.ts", () => ({
  createActiveProvider: () => ({
    name: "fake",
    model: "fake-model",
    generate: async () => ({ answer: "ok", inputTokens: 1, outputTokens: 1 }),
    generateStream: () => fakeGenerateStream(),
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
    fakeGenerateStream = async function* () {
      yield "ok";
    };
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

describe("POST /api/chat unavailable", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "fake-key");
    embeddingsCreateMock.mockReset();
    embeddingsCreateMock.mockResolvedValue({ data: [{ embedding: [1, 0, 0] }] });
    fakeStore = { check: vi.fn().mockResolvedValue({ allowed: true }) };
    fakeGenerateStream = async function* () {
      yield "ok";
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a clean 503 with a contactable fallback when the pre-stream embedding call fails", async () => {
    embeddingsCreateMock.mockRejectedValue(new Error("upstream provider down"));

    const response = await POST(
      makeChatRequest({ question: "Who is Jose?" }, { "x-forwarded-for": "1.2.3.4" }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      error: "unavailable",
      contact: { email: expect.any(String), scheduling: expect.any(String) },
    });
  });

  it("sends an error SSE event, with no citations or done event, when the provider stream fails mid-generation", async () => {
    fakeGenerateStream = async function* () {
      yield "partial answer";
      throw new Error("stream dropped");
    };

    const response = await POST(
      makeChatRequest({ question: "Who is Jose?" }, { "x-forwarded-for": "1.2.3.4" }),
    );
    const text = await response.text();

    expect(text).toContain("event: token");
    expect(text).toContain("event: error");
    const errorIndex = text.indexOf("event: error");
    expect(text.slice(errorIndex)).not.toContain("event: citations");
    expect(text.slice(errorIndex)).not.toContain("event: done");
  });
});
