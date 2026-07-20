import { renderToStaticMarkup } from "react-dom/server";
import { CareerTimeline } from "./CareerTimeline";
import type { ExperienceWithId } from "@/lib/content/read.ts";

const FIXTURE: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Fixture mission statement.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Fixture business context sentence.",
  responsibilities: ["Fixture responsibility one"],
  projects: [
    {
      title: "Fixture project",
      outcome: "Fixture outcome",
      metrics: ["50% fixture improvement"],
    },
  ],
  leadership: ["Fixture leadership story"],
  technologies: ["FixtureLang"],
  lessons: "Fixture lesson learned.",
};

describe("CareerTimeline — server-rendered (no-JS) output", () => {
  it("renders nodes with real hrefs in the static-rendered HTML, without any client-side rendering step", () => {
    const html = renderToStaticMarkup(<CareerTimeline experiences={[FIXTURE]} />);

    expect(html).toContain('href="#acme"');
    expect(html).toContain("Acme");
    expect(html).toContain("Jan 2018");
  });

  it("does not require a client component boundary", () => {
    const html = renderToStaticMarkup(<CareerTimeline experiences={[FIXTURE]} />);
    expect(html).toMatch(/<a[^>]*href="#acme"/);
  });
});
