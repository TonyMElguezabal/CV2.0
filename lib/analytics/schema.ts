import { z } from "zod";

export const EVENT_TYPES = [
  "page_view",
  "section_reach",
  "chat_open",
  "question_asked",
  "resume_download",
  "contact_click",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const CONTACT_TARGETS = ["scheduling", "email", "linkedin"] as const;
export type ContactTarget = (typeof CONTACT_TARGETS)[number];

const BaseEventFields = {
  sessionId: z.string().min(1).max(200),
  pagePath: z.string().min(1).max(2048),
};

// Client-supplied fields only. Deliberately no content/text/IP/UA field, and
// no occurredAt/dimension fields — those are always server-set (see
// lib/analytics/derive.ts and app/api/events/route.ts).
export const EventPayloadSchema = z.discriminatedUnion("eventType", [
  z.object({ ...BaseEventFields, eventType: z.literal("page_view") }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("section_reach"),
    sectionId: z.string().min(1).max(200),
    scrollDepthPercent: z.number().int().min(0).max(100),
  }),
  z.object({ ...BaseEventFields, eventType: z.literal("chat_open") }),
  z.object({ ...BaseEventFields, eventType: z.literal("question_asked") }),
  z.object({ ...BaseEventFields, eventType: z.literal("resume_download") }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("contact_click"),
    contactTarget: z.enum(CONTACT_TARGETS),
  }),
]);

export type EventPayload = z.infer<typeof EventPayloadSchema>;

export type StoredEvent = EventPayload & {
  occurredAt: Date;
  countryOrRegion: string | null;
  referrerDomain: string | null;
  deviceClass: "mobile" | "tablet" | "desktop";
};
