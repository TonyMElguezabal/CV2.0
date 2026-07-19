import { renderToStaticMarkup } from "react-dom/server";
import { CareerChapters } from "./CareerChapters";
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

describe("CareerChapters — server-rendered (no-JS) output", () => {
  it("includes all seven §F3 sections' content in the static-rendered HTML, without any client-side rendering step", () => {
    const html = renderToStaticMarkup(<CareerChapters experiences={[FIXTURE]} />);

    expect(html).toContain("Engineer at Acme");
    expect(html).toContain("Fixture mission statement.");
    expect(html).toContain("Fixture business context sentence.");
    expect(html).toContain("Fixture responsibility one");
    expect(html).toContain("Fixture project");
    expect(html).toContain("50% fixture improvement");
    expect(html).toContain("Fixture leadership story");
    expect(html).toContain("FixtureLang");
    expect(html).toContain("Fixture lesson learned.");
  });

  it("renders plain native <details>/<summary> tags in the static HTML, not gated behind any other wrapper", () => {
    const html = renderToStaticMarkup(<CareerChapters experiences={[FIXTURE]} />);

    expect(html).toMatch(/<details[^>]*><summary/);
  });

  it("renders a hidden decorative chevron whose classes drive rotation purely via CSS on the native open attribute", () => {
    const html = renderToStaticMarkup(<CareerChapters experiences={[FIXTURE]} />);

    expect(html).toMatch(/aria-hidden="true"[^>]*class="[^"]*group-open:rotate-90/);
  });

  it("hides the native details marker across browsers via the summary's class list", () => {
    const html = renderToStaticMarkup(<CareerChapters experiences={[FIXTURE]} />);

    expect(html).toMatch(/<summary class="[^"]*\[&amp;::-webkit-details-marker\]:hidden/);
  });
});
