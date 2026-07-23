import { neon } from "@neondatabase/serverless";
import type { StoredEvent } from "./schema.ts";

export interface VisitSession {
  id: string;
  startedAt: Date;
  lastEventAt: Date;
}

export interface AnalyticsStore {
  recordEvent(event: StoredEvent): Promise<void>;
}

// Exported for tests only (mirrors lib/chat/rateLimit.ts's fake pattern) —
// exposes sessions/events so tests can assert on stored shape directly.
export interface InMemoryAnalyticsStore extends AnalyticsStore {
  sessions: Map<string, VisitSession>;
  events: StoredEvent[];
}

export function createInMemoryAnalyticsStore(): InMemoryAnalyticsStore {
  const sessions = new Map<string, VisitSession>();
  const events: StoredEvent[] = [];

  return {
    sessions,
    events,
    async recordEvent(event) {
      const existing = sessions.get(event.sessionId);
      if (existing) {
        existing.lastEventAt = event.occurredAt;
      } else {
        sessions.set(event.sessionId, {
          id: event.sessionId,
          startedAt: event.occurredAt,
          lastEventAt: event.occurredAt,
        });
      }
      events.push(event);
    },
  };
}

export function createNeonAnalyticsStore(): AnalyticsStore {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(connectionString);

  return {
    async recordEvent(event) {
      await sql`
        INSERT INTO visit_session (id, started_at, last_event_at)
        VALUES (${event.sessionId}, ${event.occurredAt.toISOString()}, ${event.occurredAt.toISOString()})
        ON CONFLICT (id) DO UPDATE SET last_event_at = EXCLUDED.last_event_at
      `;

      const sectionId = "sectionId" in event ? event.sectionId : null;
      const scrollDepthPercent =
        "scrollDepthPercent" in event ? event.scrollDepthPercent : null;
      const contactTarget =
        "contactTarget" in event ? event.contactTarget : null;

      await sql`
        INSERT INTO analytics_event (
          session_id, event_type, occurred_at, page_path,
          section_id, scroll_depth_percent, contact_target,
          country_or_region, referrer_domain, device_class
        )
        VALUES (
          ${event.sessionId}, ${event.eventType}, ${event.occurredAt.toISOString()}, ${event.pagePath},
          ${sectionId}, ${scrollDepthPercent}, ${contactTarget},
          ${event.countryOrRegion}, ${event.referrerDomain}, ${event.deviceClass}
        )
      `;
    },
  };
}
