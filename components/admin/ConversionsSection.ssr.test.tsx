import { renderToStaticMarkup } from "react-dom/server";
import { ConversionsSection } from "./ConversionsSection";
import type { ConversionsReport } from "@/lib/analytics/reports.ts";

const FIXTURE_REPORT: ConversionsReport = {
  resumeDownloadCount: 12,
  contactClicksByTarget: {
    scheduling: 4,
    email: 7,
    linkedin: 2,
    github: 3,
    whatsapp: 1,
  },
};

describe("ConversionsSection — server-rendered output", () => {
  it("renders resume downloads and a contact-clicks-by-target table", () => {
    const html = renderToStaticMarkup(
      <ConversionsSection report={FIXTURE_REPORT} />,
    );

    expect(html).toMatch(/Conversions/);
    expect(html).toMatch(/12/);
    expect(html).toMatch(/Scheduling/);
    expect(html).toMatch(/Email/);
    expect(html).toMatch(/LinkedIn/);
    expect(html).toMatch(/<table/);
  });

  it("labels the footer-only contact targets by name, never by raw key", () => {
    const html = renderToStaticMarkup(
      <ConversionsSection report={FIXTURE_REPORT} />,
    );

    expect(html).toMatch(/GitHub/);
    expect(html).toMatch(/WhatsApp/);
    expect(html).not.toMatch(/>github</);
    expect(html).not.toMatch(/>whatsapp</);
  });
});
