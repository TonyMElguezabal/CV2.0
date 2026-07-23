import { createInMemoryAnalyticsStore } from "./store.ts";
import type { StoredEvent } from "./schema.ts";

function makeEvent(overrides: Partial<StoredEvent> = {}): StoredEvent {
  return {
    sessionId: "session-1",
    eventType: "page_view",
    pagePath: "/",
    occurredAt: new Date("2026-07-23T12:00:00Z"),
    countryOrRegion: "MX",
    referrerDomain: null,
    deviceClass: "desktop",
    ...overrides,
  } as StoredEvent;
}

describe("createInMemoryAnalyticsStore", () => {
  it("creates a new VisitSession with startedAt/lastEventAt on the first event for a session id", async () => {
    const store = createInMemoryAnalyticsStore();
    const event = makeEvent();

    await store.recordEvent(event);

    expect(store.sessions.size).toBe(1);
    const session = store.sessions.get("session-1");
    expect(session).toBeDefined();
    expect(session!.startedAt).toEqual(event.occurredAt);
    expect(session!.lastEventAt).toEqual(event.occurredAt);
    expect(store.events).toHaveLength(1);
  });

  it("updates lastEventAt and does not create a duplicate session on a second event for the same session id", async () => {
    const store = createInMemoryAnalyticsStore();
    const first = makeEvent({ occurredAt: new Date("2026-07-23T12:00:00Z") });
    const second = makeEvent({
      eventType: "resume_download",
      occurredAt: new Date("2026-07-23T12:05:00Z"),
    });

    await store.recordEvent(first);
    await store.recordEvent(second);

    expect(store.sessions.size).toBe(1);
    const session = store.sessions.get("session-1");
    expect(session!.startedAt).toEqual(first.occurredAt);
    expect(session!.lastEventAt).toEqual(second.occurredAt);
    expect(store.events).toHaveLength(2);
  });

  it("stores only the modeled fields — no IP, UA, or text content", async () => {
    const store = createInMemoryAnalyticsStore();
    await store.recordEvent(makeEvent());

    const stored = store.events[0];
    const keys = Object.keys(stored!);
    expect(keys).not.toContain("ip");
    expect(keys).not.toContain("userAgent");
    expect(keys).not.toContain("text");
    expect(keys).not.toContain("question");
  });
});
