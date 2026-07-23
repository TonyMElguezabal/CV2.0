import { renderToStaticMarkup } from "react-dom/server";
import { ChatUsageSection } from "./ChatUsageSection";
import type { ChatUsageReport } from "@/lib/analytics/reports.ts";

const FIXTURE_REPORT: ChatUsageReport = {
  chatOpenSessionCount: 30,
  chatOpenShare: 0.25,
  questionAskedCount: 58,
};

describe("ChatUsageSection — server-rendered output", () => {
  it("renders chat-open counts and question count, never question text", () => {
    const html = renderToStaticMarkup(<ChatUsageSection report={FIXTURE_REPORT} />);

    expect(html).toMatch(/Chat usage/);
    expect(html).toMatch(/30/);
    expect(html).toMatch(/25%/);
    expect(html).toMatch(/58/);
  });
});
