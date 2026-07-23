import type { ContactTarget, EventType, StoredEvent } from "./schema.ts";

export function makeReportEvent(
  overrides: Partial<StoredEvent> & { eventType: EventType },
): StoredEvent {
  return {
    sessionId: "session-1",
    pagePath: "/",
    occurredAt: new Date("2026-07-23T12:00:00Z"),
    countryOrRegion: "MX",
    referrerDomain: null,
    deviceClass: "desktop",
    ...overrides,
  } as StoredEvent;
}

export function makeContactClickEvent(
  contactTarget: ContactTarget,
  overrides: Partial<StoredEvent> = {},
): StoredEvent {
  return makeReportEvent({
    eventType: "contact_click",
    contactTarget,
    ...overrides,
  } as Partial<StoredEvent> & { eventType: "contact_click" });
}

export function makeSectionReachEvent(
  sectionId: string,
  scrollDepthPercent: number,
  overrides: Partial<StoredEvent> = {},
): StoredEvent {
  return makeReportEvent({
    eventType: "section_reach",
    sectionId,
    scrollDepthPercent,
    ...overrides,
  } as Partial<StoredEvent> & { eventType: "section_reach" });
}
