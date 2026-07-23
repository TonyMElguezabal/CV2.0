import { renderToStaticMarkup } from "react-dom/server";
import { EngagementSection } from "./EngagementSection";
import type { EngagementReport } from "@/lib/analytics/reports.ts";

const FIXTURE_REPORT: EngagementReport = {
  medianSessionDurationSeconds: 150,
  secondChapterReachShare: 0.42,
  deepestSectionDistribution: { "chapter-b": 3, "chapter-a": 1 },
  scrollDepthDistribution: [
    { milestone: 25, sessionCount: 4 },
    { milestone: 75, sessionCount: 2 },
  ],
};

describe("EngagementSection — server-rendered output", () => {
  it("renders median duration and second-chapter reach share", () => {
    const html = renderToStaticMarkup(
      <EngagementSection report={FIXTURE_REPORT} />,
    );

    expect(html).toMatch(/Engagement depth/);
    expect(html).toMatch(/2m 30s/);
    expect(html).toMatch(/42%/);
    expect(html).toMatch(/25%/);
  });
});
