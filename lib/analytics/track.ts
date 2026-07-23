import { getSessionId } from "../session.ts";

export type AnalyticsEvent =
  | { eventType: "page_view"; pagePath: string }
  | {
      eventType: "section_reach";
      pagePath: string;
      sectionId: string;
      scrollDepthPercent: number;
    }
  | { eventType: "chat_open"; pagePath: string }
  | { eventType: "question_asked"; pagePath: string }
  | { eventType: "resume_download"; pagePath: string }
  | {
      eventType: "contact_click";
      pagePath: string;
      contactTarget: "scheduling" | "email" | "linkedin";
    };

const EVENTS_ENDPOINT = "/api/events";

// Fire-and-forget: analytics must never block the page or surface an error
// to the caller, so every failure mode here is swallowed (PRD §9).
export function track(event: AnalyticsEvent): void {
  try {
    const payload = JSON.stringify({ sessionId: getSessionId(), ...event });

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(EVENTS_ENDPOINT, blob);
      return;
    }

    fetch(EVENTS_ENDPOINT, {
      method: "POST",
      body: payload,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      // best-effort; a failed beacon never affects the page
    });
  } catch {
    // best-effort; a failed beacon never affects the page
  }
}
