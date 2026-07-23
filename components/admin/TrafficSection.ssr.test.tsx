import { renderToStaticMarkup } from "react-dom/server";
import { TrafficSection } from "./TrafficSection";
import type { TrafficReport } from "@/lib/analytics/reports.ts";

const FIXTURE_REPORT: TrafficReport = {
  pageViewCount: 120,
  uniqueSessionCount: 45,
  dailyTrend: [
    { date: "2026-07-20", pageViews: 30 },
    { date: "2026-07-21", pageViews: 90 },
  ],
  byDeviceClass: { desktop: 80, mobile: 40 },
  byCountryOrRegion: { MX: 100, US: 20 },
  byReferrerDomain: { direct: 60, "linkedin.com": 60 },
};

describe("TrafficSection — server-rendered output", () => {
  it("renders the traffic totals and daily trend", () => {
    const html = renderToStaticMarkup(<TrafficSection report={FIXTURE_REPORT} />);

    expect(html).toMatch(/Traffic/);
    expect(html).toMatch(/120/);
    expect(html).toMatch(/45/);
    expect(html).toMatch(/2026-07-20/);
  });
});
