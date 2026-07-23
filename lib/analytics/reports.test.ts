import { createInMemoryAnalyticsReports } from "./reports.ts";
import {
  makeContactClickEvent,
  makeReportEvent,
  makeSectionReachEvent,
} from "./reportFixtures.ts";
import type { StoredEvent } from "./schema.ts";

const ORDERED_CHAPTER_IDS = ["chapter-a", "chapter-b", "chapter-c"];

describe("createInMemoryAnalyticsReports — traffic report", () => {
  it("counts total page views and unique sessions", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({ eventType: "page_view", sessionId: "s1" }),
      makeReportEvent({ eventType: "page_view", sessionId: "s1" }),
      makeReportEvent({ eventType: "page_view", sessionId: "s2" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const traffic = await reports.getTrafficReport();

    expect(traffic.pageViewCount).toBe(3);
    expect(traffic.uniqueSessionCount).toBe(2);
  });

  it("buckets page views into a daily trend", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s1",
        occurredAt: new Date("2026-07-20T10:00:00Z"),
      }),
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s2",
        occurredAt: new Date("2026-07-20T22:00:00Z"),
      }),
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s3",
        occurredAt: new Date("2026-07-21T09:00:00Z"),
      }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const traffic = await reports.getTrafficReport();

    expect(traffic.dailyTrend).toEqual([
      { date: "2026-07-20", pageViews: 2 },
      { date: "2026-07-21", pageViews: 1 },
    ]);
  });

  it("breaks traffic down by device class, country/region, and referrer domain", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s1",
        deviceClass: "mobile",
        countryOrRegion: "MX",
        referrerDomain: "linkedin.com",
      }),
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s2",
        deviceClass: "desktop",
        countryOrRegion: "US",
        referrerDomain: null,
      }),
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s3",
        deviceClass: "mobile",
        countryOrRegion: "MX",
        referrerDomain: "linkedin.com",
      }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const traffic = await reports.getTrafficReport();

    expect(traffic.byDeviceClass).toEqual({ mobile: 2, desktop: 1 });
    expect(traffic.byCountryOrRegion).toEqual({ MX: 2, US: 1 });
    expect(traffic.byReferrerDomain).toEqual({
      "linkedin.com": 2,
      direct: 1,
    });
  });

  it("returns zeroed report when there are no events", async () => {
    const reports = createInMemoryAnalyticsReports([], ORDERED_CHAPTER_IDS);

    const traffic = await reports.getTrafficReport();

    expect(traffic).toEqual({
      pageViewCount: 0,
      uniqueSessionCount: 0,
      dailyTrend: [],
      byDeviceClass: {},
      byCountryOrRegion: {},
      byReferrerDomain: {},
    });
  });
});

describe("createInMemoryAnalyticsReports — engagement report", () => {
  it("computes the median session duration in seconds", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s1",
        occurredAt: new Date("2026-07-20T10:00:00Z"),
      }),
      makeReportEvent({
        eventType: "resume_download",
        sessionId: "s1",
        occurredAt: new Date("2026-07-20T10:02:00Z"),
      }),
      makeReportEvent({
        eventType: "page_view",
        sessionId: "s2",
        occurredAt: new Date("2026-07-20T11:00:00Z"),
      }),
      makeReportEvent({
        eventType: "resume_download",
        sessionId: "s2",
        occurredAt: new Date("2026-07-20T11:10:00Z"),
      }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const engagement = await reports.getEngagementReport();

    expect(engagement.medianSessionDurationSeconds).toBe(360);
  });

  it("computes the share of sessions reaching the second chapter", async () => {
    const events: StoredEvent[] = [
      makeSectionReachEvent("chapter-a", 10, { sessionId: "s1" }),
      makeSectionReachEvent("chapter-b", 40, { sessionId: "s1" }),
      makeSectionReachEvent("chapter-a", 10, { sessionId: "s2" }),
      makeSectionReachEvent("chapter-a", 10, { sessionId: "s3" }),
      makeSectionReachEvent("chapter-b", 40, { sessionId: "s3" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const engagement = await reports.getEngagementReport();

    expect(engagement.secondChapterReachShare).toBeCloseTo(2 / 3);
  });

  it("computes a deepest-section distribution", async () => {
    const events: StoredEvent[] = [
      makeSectionReachEvent("chapter-a", 10, { sessionId: "s1" }),
      makeSectionReachEvent("chapter-b", 40, { sessionId: "s1" }),
      makeSectionReachEvent("chapter-a", 10, { sessionId: "s2" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const engagement = await reports.getEngagementReport();

    expect(engagement.deepestSectionDistribution).toEqual({
      "chapter-b": 1,
      "chapter-a": 1,
    });
  });

  it("computes a scroll-depth milestone distribution", async () => {
    const events: StoredEvent[] = [
      makeSectionReachEvent("chapter-a", 25, { sessionId: "s1" }),
      makeSectionReachEvent("chapter-b", 75, { sessionId: "s1" }),
      makeSectionReachEvent("chapter-a", 25, { sessionId: "s2" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const engagement = await reports.getEngagementReport();

    expect(engagement.scrollDepthDistribution).toEqual([
      { milestone: 25, sessionCount: 2 },
      { milestone: 75, sessionCount: 1 },
    ]);
  });
});

describe("createInMemoryAnalyticsReports — chat usage report", () => {
  it("counts sessions that opened chat and their share of all sessions", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({ eventType: "page_view", sessionId: "s1" }),
      makeReportEvent({ eventType: "chat_open", sessionId: "s1" }),
      makeReportEvent({ eventType: "page_view", sessionId: "s2" }),
      makeReportEvent({ eventType: "page_view", sessionId: "s3" }),
      makeReportEvent({ eventType: "chat_open", sessionId: "s3" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const chat = await reports.getChatUsageReport();

    expect(chat.chatOpenSessionCount).toBe(2);
    expect(chat.chatOpenShare).toBeCloseTo(2 / 3);
  });

  it("counts questions asked without exposing any text field", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({ eventType: "question_asked", sessionId: "s1" }),
      makeReportEvent({ eventType: "question_asked", sessionId: "s1" }),
      makeReportEvent({ eventType: "question_asked", sessionId: "s2" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const chat = await reports.getChatUsageReport();

    expect(chat.questionAskedCount).toBe(3);
  });
});

describe("createInMemoryAnalyticsReports — conversions report", () => {
  it("counts resume downloads and contact clicks by target", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({ eventType: "resume_download", sessionId: "s1" }),
      makeReportEvent({ eventType: "resume_download", sessionId: "s2" }),
      makeContactClickEvent("email", { sessionId: "s1" }),
      makeContactClickEvent("email", { sessionId: "s3" }),
      makeContactClickEvent("linkedin", { sessionId: "s2" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const conversions = await reports.getConversionsReport();

    expect(conversions.resumeDownloadCount).toBe(2);
    expect(conversions.contactClicksByTarget).toEqual({
      email: 2,
      linkedin: 1,
      scheduling: 0,
    });
  });
});

describe("createInMemoryAnalyticsReports — anonymity (AC2)", () => {
  it("returns only aggregate shapes, never raw session rows or PII fields", async () => {
    const events: StoredEvent[] = [
      makeReportEvent({ eventType: "page_view", sessionId: "s1" }),
      makeReportEvent({ eventType: "question_asked", sessionId: "s1" }),
    ];
    const reports = createInMemoryAnalyticsReports(events, ORDERED_CHAPTER_IDS);

    const [traffic, engagement, chat, conversions] = await Promise.all([
      reports.getTrafficReport(),
      reports.getEngagementReport(),
      reports.getChatUsageReport(),
      reports.getConversionsReport(),
    ]);

    for (const report of [traffic, engagement, chat, conversions]) {
      const serialized = JSON.stringify(report);
      expect(serialized).not.toMatch(/sessionId/i);
      expect(serialized).not.toMatch(/\bip\b/i);
      expect(serialized).not.toMatch(/userAgent/i);
      expect(serialized).not.toMatch(/question(?!AskedCount)/i);
    }
  });
});

describe("createInMemoryAnalyticsReports — empty store", () => {
  it("returns well-defined empty/zero results for every report, not a throw", async () => {
    const reports = createInMemoryAnalyticsReports([], ORDERED_CHAPTER_IDS);

    const [traffic, engagement, chat, conversions] = await Promise.all([
      reports.getTrafficReport(),
      reports.getEngagementReport(),
      reports.getChatUsageReport(),
      reports.getConversionsReport(),
    ]);

    expect(traffic.pageViewCount).toBe(0);
    expect(engagement.medianSessionDurationSeconds).toBe(0);
    expect(engagement.secondChapterReachShare).toBe(0);
    expect(chat.chatOpenSessionCount).toBe(0);
    expect(chat.questionAskedCount).toBe(0);
    expect(conversions.resumeDownloadCount).toBe(0);
    expect(conversions.contactClicksByTarget).toEqual({
      scheduling: 0,
      email: 0,
      linkedin: 0,
    });
  });
});
