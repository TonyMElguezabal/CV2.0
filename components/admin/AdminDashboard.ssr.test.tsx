import { renderToStaticMarkup } from "react-dom/server";
import { AdminDashboard } from "./AdminDashboard";
import type { AdminDashboardProps } from "./AdminDashboard";

const EMPTY_PROPS: AdminDashboardProps = {
  traffic: {
    pageViewCount: 0,
    uniqueSessionCount: 0,
    dailyTrend: [],
    byDeviceClass: {},
    byCountryOrRegion: {},
    byReferrerDomain: {},
  },
  engagement: {
    medianSessionDurationSeconds: 0,
    secondChapterReachShare: 0,
    deepestSectionDistribution: {},
    scrollDepthDistribution: [],
  },
  chat: { chatOpenSessionCount: 0, chatOpenShare: 0, questionAskedCount: 0 },
  conversions: {
    resumeDownloadCount: 0,
    contactClicksByTarget: { scheduling: 0, email: 0, linkedin: 0 },
  },
};

const POPULATED_PROPS: AdminDashboardProps = {
  traffic: {
    pageViewCount: 120,
    uniqueSessionCount: 45,
    dailyTrend: [{ date: "2026-07-20", pageViews: 120 }],
    byDeviceClass: { desktop: 120 },
    byCountryOrRegion: { MX: 120 },
    byReferrerDomain: { direct: 120 },
  },
  engagement: {
    medianSessionDurationSeconds: 150,
    secondChapterReachShare: 0.4,
    deepestSectionDistribution: { "chapter-a": 45 },
    scrollDepthDistribution: [{ milestone: 25, sessionCount: 45 }],
  },
  chat: { chatOpenSessionCount: 30, chatOpenShare: 0.25, questionAskedCount: 58 },
  conversions: {
    resumeDownloadCount: 12,
    contactClicksByTarget: { scheduling: 4, email: 7, linkedin: 2 },
  },
};

describe("AdminDashboard — server-rendered output", () => {
  it("renders an Insights heading", () => {
    const html = renderToStaticMarkup(<AdminDashboard {...EMPTY_PROPS} />);

    expect(html).toMatch(/Insights/);
  });

  it("renders the empty state when there is no data yet", () => {
    const html = renderToStaticMarkup(<AdminDashboard {...EMPTY_PROPS} />);

    expect(html).toMatch(/no data yet/i);
    expect(html).not.toMatch(/Traffic/);
  });

  it("renders all four report sections when data exists", () => {
    const html = renderToStaticMarkup(<AdminDashboard {...POPULATED_PROPS} />);

    expect(html).not.toMatch(/no data yet/i);
    expect(html).toMatch(/Traffic/);
    expect(html).toMatch(/Engagement depth/);
    expect(html).toMatch(/Chat usage/);
    expect(html).toMatch(/Conversions/);
  });
});
