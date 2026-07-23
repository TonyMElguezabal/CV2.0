// @vitest-environment jsdom
// track() reads navigator.sendBeacon/fetch and writes no cookies/storage —
// browser globals it needs are only present in jsdom, unlike this repo's
// other lib/ tests which stay on Vitest's default node environment.
import { track } from "./track.ts";

describe("track", () => {
  beforeEach(() => {
    document.cookie = "";
  });

  it("sends a page_view event via sendBeacon with session id, eventType, and pagePath", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });

    track({ eventType: "page_view", pagePath: "/" });

    expect(sendBeacon).toHaveBeenCalledOnce();
    const [url, bodyBlob] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    expect(url).toBe("/api/events");
    expect(bodyBlob).toBeInstanceOf(Blob);
  });

  it("includes a stable sessionId and no occurredAt/dimension fields in the payload", async () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });

    track({ eventType: "page_view", pagePath: "/" });

    const [, bodyBlob] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    const payload = JSON.parse(await bodyBlob.text());

    expect(payload).toHaveProperty("sessionId");
    expect(typeof payload.sessionId).toBe("string");
    expect(payload.eventType).toBe("page_view");
    expect(payload.pagePath).toBe("/");
    expect(payload).not.toHaveProperty("occurredAt");
    expect(payload).not.toHaveProperty("countryOrRegion");
    expect(payload).not.toHaveProperty("referrerDomain");
    expect(payload).not.toHaveProperty("deviceClass");
  });

  it("includes sectionId and scrollDepthPercent for a section_reach event", async () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });

    track({
      eventType: "section_reach",
      pagePath: "/",
      sectionId: "oracle",
      scrollDepthPercent: 40,
    });

    const [, bodyBlob] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    const payload = JSON.parse(await bodyBlob.text());

    expect(payload.sectionId).toBe("oracle");
    expect(payload.scrollDepthPercent).toBe(40);
  });

  it("falls back to fetch with keepalive when sendBeacon is unavailable", () => {
    vi.stubGlobal("navigator", {});
    const fetchMock = vi.fn(() => Promise.resolve());
    vi.stubGlobal("fetch", fetchMock);

    track({ eventType: "page_view", pagePath: "/" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/events");
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe("POST");
  });

  it("does not throw or propagate when sendBeacon throws", () => {
    vi.stubGlobal("navigator", {
      sendBeacon: () => {
        throw new Error("boom");
      },
    });

    expect(() => track({ eventType: "page_view", pagePath: "/" })).not.toThrow();
  });

  it("does not throw or propagate when fetch fallback rejects", () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("fetch", () => Promise.reject(new Error("network down")));

    expect(() => track({ eventType: "page_view", pagePath: "/" })).not.toThrow();
  });

  it("writes no document.cookie", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });

    track({ eventType: "page_view", pagePath: "/" });

    expect(document.cookie).toBe("");
  });
});
