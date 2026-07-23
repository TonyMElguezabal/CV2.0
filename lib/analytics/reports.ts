import { neon } from "@neondatabase/serverless";
import type { ContactTarget, StoredEvent } from "./schema.ts";

export interface TrafficReport {
  pageViewCount: number;
  uniqueSessionCount: number;
  dailyTrend: { date: string; pageViews: number }[];
  byDeviceClass: Record<string, number>;
  byCountryOrRegion: Record<string, number>;
  byReferrerDomain: Record<string, number>;
}

export interface EngagementReport {
  medianSessionDurationSeconds: number;
  secondChapterReachShare: number;
  deepestSectionDistribution: Record<string, number>;
  scrollDepthDistribution: { milestone: number; sessionCount: number }[];
}

export interface ChatUsageReport {
  chatOpenSessionCount: number;
  chatOpenShare: number;
  questionAskedCount: number;
}

export interface ConversionsReport {
  resumeDownloadCount: number;
  contactClicksByTarget: Record<ContactTarget, number>;
}

export interface AnalyticsReports {
  getTrafficReport(): Promise<TrafficReport>;
  getEngagementReport(): Promise<EngagementReport>;
  getChatUsageReport(): Promise<ChatUsageReport>;
  getConversionsReport(): Promise<ConversionsReport>;
}

const CONTACT_TARGETS: ContactTarget[] = ["scheduling", "email", "linkedin"];

function incrementCount(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

export function createInMemoryAnalyticsReports(
  events: StoredEvent[],
  orderedChapterIds: string[],
): AnalyticsReports {
  return {
    async getTrafficReport(): Promise<TrafficReport> {
      const pageViews = events.filter((e) => e.eventType === "page_view");
      const uniqueSessionIds = new Set(pageViews.map((e) => e.sessionId));

      const dailyCounts = new Map<string, number>();
      const byDeviceClass: Record<string, number> = {};
      const byCountryOrRegion: Record<string, number> = {};
      const byReferrerDomain: Record<string, number> = {};

      for (const event of pageViews) {
        const date = event.occurredAt.toISOString().slice(0, 10);
        dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
        incrementCount(byDeviceClass, event.deviceClass);
        if (event.countryOrRegion) {
          incrementCount(byCountryOrRegion, event.countryOrRegion);
        }
        incrementCount(byReferrerDomain, event.referrerDomain ?? "direct");
      }

      const dailyTrend = [...dailyCounts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, pageViews]) => ({ date, pageViews }));

      return {
        pageViewCount: pageViews.length,
        uniqueSessionCount: uniqueSessionIds.size,
        dailyTrend,
        byDeviceClass,
        byCountryOrRegion,
        byReferrerDomain,
      };
    },

    async getEngagementReport(): Promise<EngagementReport> {
      const sessionBounds = new Map<
        string,
        { start: Date; end: Date }
      >();
      for (const event of events) {
        const existing = sessionBounds.get(event.sessionId);
        if (!existing) {
          sessionBounds.set(event.sessionId, {
            start: event.occurredAt,
            end: event.occurredAt,
          });
        } else {
          if (event.occurredAt < existing.start) existing.start = event.occurredAt;
          if (event.occurredAt > existing.end) existing.end = event.occurredAt;
        }
      }
      const durations = [...sessionBounds.values()].map(
        ({ start, end }) => (end.getTime() - start.getTime()) / 1000,
      );

      const sectionReaches = events.filter(
        (e): e is Extract<StoredEvent, { eventType: "section_reach" }> =>
          e.eventType === "section_reach",
      );

      const sessionsReachedIds = new Map<string, Set<string>>();
      for (const event of sectionReaches) {
        const set = sessionsReachedIds.get(event.sessionId) ?? new Set<string>();
        set.add(event.sectionId);
        sessionsReachedIds.set(event.sessionId, set);
      }

      const secondChapterId = orderedChapterIds[1];
      const allSessionIds = new Set(events.map((e) => e.sessionId));
      let secondChapterReachCount = 0;
      if (secondChapterId) {
        for (const reachedIds of sessionsReachedIds.values()) {
          if (reachedIds.has(secondChapterId)) secondChapterReachCount += 1;
        }
      }
      const secondChapterReachShare =
        allSessionIds.size === 0
          ? 0
          : secondChapterReachCount / allSessionIds.size;

      const deepestSectionDistribution: Record<string, number> = {};
      for (const reachedIds of sessionsReachedIds.values()) {
        let deepestIndex = -1;
        let deepestId: string | null = null;
        for (const id of reachedIds) {
          const index = orderedChapterIds.indexOf(id);
          if (index > deepestIndex) {
            deepestIndex = index;
            deepestId = id;
          }
        }
        if (deepestId) incrementCount(deepestSectionDistribution, deepestId);
      }

      const scrollMilestoneSessions = new Map<number, Set<string>>();
      for (const event of sectionReaches) {
        const set =
          scrollMilestoneSessions.get(event.scrollDepthPercent) ??
          new Set<string>();
        set.add(event.sessionId);
        scrollMilestoneSessions.set(event.scrollDepthPercent, set);
      }
      const scrollDepthDistribution = [...scrollMilestoneSessions.entries()]
        .sort(([a], [b]) => a - b)
        .map(([milestone, sessions]) => ({
          milestone,
          sessionCount: sessions.size,
        }));

      return {
        medianSessionDurationSeconds: median(durations),
        secondChapterReachShare,
        deepestSectionDistribution,
        scrollDepthDistribution,
      };
    },

    async getChatUsageReport(): Promise<ChatUsageReport> {
      const chatOpenSessionIds = new Set(
        events
          .filter((e) => e.eventType === "chat_open")
          .map((e) => e.sessionId),
      );
      const allSessionIds = new Set(events.map((e) => e.sessionId));
      const questionAskedCount = events.filter(
        (e) => e.eventType === "question_asked",
      ).length;

      return {
        chatOpenSessionCount: chatOpenSessionIds.size,
        chatOpenShare:
          allSessionIds.size === 0
            ? 0
            : chatOpenSessionIds.size / allSessionIds.size,
        questionAskedCount,
      };
    },

    async getConversionsReport(): Promise<ConversionsReport> {
      const resumeDownloadCount = events.filter(
        (e) => e.eventType === "resume_download",
      ).length;

      const contactClicksByTarget = Object.fromEntries(
        CONTACT_TARGETS.map((target) => [target, 0]),
      ) as Record<ContactTarget, number>;
      for (const event of events) {
        if (event.eventType === "contact_click") {
          contactClicksByTarget[event.contactTarget] += 1;
        }
      }

      return { resumeDownloadCount, contactClicksByTarget };
    },
  };
}

export function createNeonAnalyticsReports(
  orderedChapterIds: string[],
): AnalyticsReports {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(connectionString);

  return {
    async getTrafficReport(): Promise<TrafficReport> {
      const [totalsRows, dailyRows, deviceRows, countryRows, referrerRows] =
        await Promise.all([
          sql`
            SELECT COUNT(*)::int AS page_view_count,
                   COUNT(DISTINCT session_id)::int AS unique_session_count
            FROM analytics_event
            WHERE event_type = 'page_view'
          `,
          sql`
            SELECT to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD') AS date,
                   COUNT(*)::int AS page_views
            FROM analytics_event
            WHERE event_type = 'page_view'
            GROUP BY 1
            ORDER BY 1
          `,
          sql`
            SELECT device_class, COUNT(*)::int AS count
            FROM analytics_event
            WHERE event_type = 'page_view'
            GROUP BY device_class
          `,
          sql`
            SELECT country_or_region, COUNT(*)::int AS count
            FROM analytics_event
            WHERE event_type = 'page_view' AND country_or_region IS NOT NULL
            GROUP BY country_or_region
          `,
          sql`
            SELECT COALESCE(referrer_domain, 'direct') AS domain, COUNT(*)::int AS count
            FROM analytics_event
            WHERE event_type = 'page_view'
            GROUP BY 1
          `,
        ]);

      const totals = totalsRows[0] as
        | { page_view_count: number; unique_session_count: number }
        | undefined;

      return {
        pageViewCount: totals?.page_view_count ?? 0,
        uniqueSessionCount: totals?.unique_session_count ?? 0,
        dailyTrend: (dailyRows as { date: string; page_views: number }[]).map(
          (row) => ({ date: row.date, pageViews: row.page_views }),
        ),
        byDeviceClass: Object.fromEntries(
          (deviceRows as { device_class: string; count: number }[]).map(
            (row) => [row.device_class, row.count],
          ),
        ),
        byCountryOrRegion: Object.fromEntries(
          (
            countryRows as { country_or_region: string; count: number }[]
          ).map((row) => [row.country_or_region, row.count]),
        ),
        byReferrerDomain: Object.fromEntries(
          (referrerRows as { domain: string; count: number }[]).map(
            (row) => [row.domain, row.count],
          ),
        ),
      };
    },

    async getEngagementReport(): Promise<EngagementReport> {
      const secondChapterId = orderedChapterIds[1];

      const [durationRows, totalSessionRows, secondChapterRows, reachRows, scrollRows] =
        await Promise.all([
          sql`
            SELECT percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(EPOCH FROM (last_event_at - started_at))
            )::float AS median_seconds
            FROM visit_session
          `,
          sql`SELECT COUNT(*)::int AS count FROM visit_session`,
          secondChapterId
            ? sql`
                SELECT COUNT(DISTINCT session_id)::int AS count
                FROM analytics_event
                WHERE event_type = 'section_reach' AND section_id = ${secondChapterId}
              `
            : Promise.resolve([{ count: 0 }]),
          sql`
            SELECT DISTINCT session_id, section_id
            FROM analytics_event
            WHERE event_type = 'section_reach'
          `,
          sql`
            SELECT scroll_depth_percent AS milestone,
                   COUNT(DISTINCT session_id)::int AS session_count
            FROM analytics_event
            WHERE event_type = 'section_reach'
            GROUP BY scroll_depth_percent
            ORDER BY scroll_depth_percent
          `,
        ]);

      const medianSessionDurationSeconds =
        (durationRows[0] as { median_seconds: number | null } | undefined)
          ?.median_seconds ?? 0;
      const totalSessions =
        (totalSessionRows[0] as { count: number } | undefined)?.count ?? 0;
      const secondChapterReachCount =
        (secondChapterRows[0] as { count: number } | undefined)?.count ?? 0;
      const secondChapterReachShare =
        totalSessions === 0 ? 0 : secondChapterReachCount / totalSessions;

      const sessionsReachedIds = new Map<string, Set<string>>();
      for (const row of reachRows as { session_id: string; section_id: string }[]) {
        const set =
          sessionsReachedIds.get(row.session_id) ?? new Set<string>();
        set.add(row.section_id);
        sessionsReachedIds.set(row.session_id, set);
      }
      const deepestSectionDistribution: Record<string, number> = {};
      for (const reachedIds of sessionsReachedIds.values()) {
        let deepestIndex = -1;
        let deepestId: string | null = null;
        for (const id of reachedIds) {
          const index = orderedChapterIds.indexOf(id);
          if (index > deepestIndex) {
            deepestIndex = index;
            deepestId = id;
          }
        }
        if (deepestId) {
          deepestSectionDistribution[deepestId] =
            (deepestSectionDistribution[deepestId] ?? 0) + 1;
        }
      }

      return {
        medianSessionDurationSeconds,
        secondChapterReachShare,
        deepestSectionDistribution,
        scrollDepthDistribution: (
          scrollRows as { milestone: number; session_count: number }[]
        ).map((row) => ({
          milestone: row.milestone,
          sessionCount: row.session_count,
        })),
      };
    },

    async getChatUsageReport(): Promise<ChatUsageReport> {
      const [chatOpenRows, totalSessionRows, questionRows] = await Promise.all([
        sql`
          SELECT COUNT(DISTINCT session_id)::int AS count
          FROM analytics_event
          WHERE event_type = 'chat_open'
        `,
        sql`SELECT COUNT(*)::int AS count FROM visit_session`,
        sql`
          SELECT COUNT(*)::int AS count
          FROM analytics_event
          WHERE event_type = 'question_asked'
        `,
      ]);

      const chatOpenSessionCount =
        (chatOpenRows[0] as { count: number } | undefined)?.count ?? 0;
      const totalSessions =
        (totalSessionRows[0] as { count: number } | undefined)?.count ?? 0;
      const questionAskedCount =
        (questionRows[0] as { count: number } | undefined)?.count ?? 0;

      return {
        chatOpenSessionCount,
        chatOpenShare: totalSessions === 0 ? 0 : chatOpenSessionCount / totalSessions,
        questionAskedCount,
      };
    },

    async getConversionsReport(): Promise<ConversionsReport> {
      const [resumeRows, contactRows] = await Promise.all([
        sql`
          SELECT COUNT(*)::int AS count
          FROM analytics_event
          WHERE event_type = 'resume_download'
        `,
        sql`
          SELECT contact_target, COUNT(*)::int AS count
          FROM analytics_event
          WHERE event_type = 'contact_click'
          GROUP BY contact_target
        `,
      ]);

      const resumeDownloadCount =
        (resumeRows[0] as { count: number } | undefined)?.count ?? 0;

      const contactClicksByTarget = Object.fromEntries(
        CONTACT_TARGETS.map((target) => [target, 0]),
      ) as Record<ContactTarget, number>;
      for (const row of contactRows as {
        contact_target: ContactTarget;
        count: number;
      }[]) {
        contactClicksByTarget[row.contact_target] = row.count;
      }

      return { resumeDownloadCount, contactClicksByTarget };
    },
  };
}
