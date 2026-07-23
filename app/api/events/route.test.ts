import { POST } from "./route.ts";
import type { RateLimitStore } from "../../../lib/chat/rateLimit.ts";
import type { AnalyticsStore } from "../../../lib/analytics/store.ts";
import type { StoredEvent } from "../../../lib/analytics/schema.ts";

let fakeRateLimitStore: { check: ReturnType<typeof vi.fn> };
let recordEventMock: ReturnType<
  typeof vi.fn<(event: StoredEvent) => Promise<void>>
>;

vi.mock("../../../lib/chat/rateLimit.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/chat/rateLimit.ts")>();
  return {
    ...actual,
    createUpstashRateLimitStore: (): RateLimitStore =>
      fakeRateLimitStore as unknown as RateLimitStore,
  };
});

vi.mock("../../../lib/analytics/store.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/analytics/store.ts")>();
  return {
    ...actual,
    createNeonAnalyticsStore: (): AnalyticsStore => ({
      recordEvent: recordEventMock,
    }),
  };
});

function makeEventRequest(
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request("http://localhost/api/events", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

beforeEach(() => {
  fakeRateLimitStore = { check: vi.fn().mockResolvedValue({ allowed: true }) };
  recordEventMock = vi.fn().mockResolvedValue(undefined);
});

describe("POST /api/events validation", () => {
  it("returns 2xx and records a valid page_view event", async () => {
    const response = await POST(
      makeEventRequest({
        sessionId: "session-1",
        eventType: "page_view",
        pagePath: "/",
      })
    );

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    expect(recordEventMock).toHaveBeenCalledOnce();
  });

  it("derives dimensions from headers and stores no raw IP/UA/text", async () => {
    await POST(
      makeEventRequest(
        {
          sessionId: "session-1",
          eventType: "page_view",
          pagePath: "/",
        },
        {
          "x-forwarded-for": "203.0.113.5",
          "x-vercel-ip-country": "MX",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          referer: "https://www.google.com/search?q=jose",
        }
      )
    );

    const stored = recordEventMock.mock.calls[0]![0] as StoredEvent;
    expect(stored.countryOrRegion).toBe("MX");
    expect(stored.referrerDomain).toBe("www.google.com");
    expect(stored.deviceClass).toBe("desktop");
    expect(JSON.stringify(stored)).not.toContain("203.0.113.5");
    expect(JSON.stringify(stored)).not.toContain("Macintosh");
  });

  it("does not let a question_asked payload's extra text field land on the stored event", async () => {
    await POST(
      makeEventRequest({
        sessionId: "session-1",
        eventType: "question_asked",
        pagePath: "/",
        text: "What is Jose's experience with Kubernetes?",
        question: "What is Jose's experience with Kubernetes?",
      })
    );

    const stored = recordEventMock.mock.calls[0]![0] as StoredEvent;
    expect(stored).not.toHaveProperty("text");
    expect(stored).not.toHaveProperty("question");
  });

  it("returns 4xx and does not record for an unknown eventType", async () => {
    const response = await POST(
      makeEventRequest({
        sessionId: "session-1",
        eventType: "page_click",
        pagePath: "/",
      })
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(recordEventMock).not.toHaveBeenCalled();
  });

  it("returns 4xx and does not record when a section_reach event is missing sectionId", async () => {
    const response = await POST(
      makeEventRequest({
        sessionId: "session-1",
        eventType: "section_reach",
        pagePath: "/",
        scrollDepthPercent: 40,
      })
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(recordEventMock).not.toHaveBeenCalled();
  });

  it("returns 4xx for a malformed JSON body", async () => {
    const response = await POST(makeEventRequest("not json"));

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(recordEventMock).not.toHaveBeenCalled();
  });

  it("sets occurredAt server-side even if the client sends one", async () => {
    await POST(
      makeEventRequest({
        sessionId: "session-1",
        eventType: "page_view",
        pagePath: "/",
        occurredAt: "1999-01-01T00:00:00Z",
      })
    );

    const stored = recordEventMock.mock.calls[0]![0] as StoredEvent;
    expect(stored.occurredAt).toBeInstanceOf(Date);
    expect(stored.occurredAt.getFullYear()).not.toBe(1999);
  });
});

describe("POST /api/events rate limiting", () => {
  it("rejects without persisting when the rate limit is exceeded", async () => {
    fakeRateLimitStore.check.mockResolvedValue({ allowed: false });

    const response = await POST(
      makeEventRequest(
        { sessionId: "session-1", eventType: "page_view", pagePath: "/" },
        { "x-forwarded-for": "1.2.3.4" }
      )
    );

    expect(response.status).toBe(429);
    expect(recordEventMock).not.toHaveBeenCalled();
  });

  it("allows the event through when the rate-limit store errors (fail-open)", async () => {
    fakeRateLimitStore.check.mockRejectedValue(new Error("limiter down"));

    const response = await POST(
      makeEventRequest(
        { sessionId: "session-1", eventType: "page_view", pagePath: "/" },
        { "x-forwarded-for": "1.2.3.4" }
      )
    );

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    expect(recordEventMock).toHaveBeenCalledOnce();
  });
});
