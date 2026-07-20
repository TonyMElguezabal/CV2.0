import { renderToStaticMarkup } from "react-dom/server";
import { ProjectsSection } from "./ProjectsSection";
import type { ProjectWithId } from "@/lib/content/read.ts";

const FIXTURE_PROJECT: ProjectWithId = {
  id: "fixture-project",
  title: "Fixture Project",
  company: "Acme",
  skills: ["FixtureSkill"],
  metrics: ["Fixture metric"],
  problem: "Fixture problem text.",
  approach: "Fixture approach text.",
  outcome: "Fixture outcome text.",
};

describe("ProjectsSection — server-rendered (no-JS) output", () => {
  it("renders card content in static-rendered HTML, without any client-side rendering step", () => {
    const html = renderToStaticMarkup(
      <ProjectsSection projects={[FIXTURE_PROJECT]} />
    );

    expect(html).toContain("Fixture Project");
    expect(html).toContain("Fixture problem text.");
    expect(html).toContain("Fixture approach text.");
    expect(html).toContain("Fixture outcome text.");
    expect(html).toContain("Fixture metric");
    expect(html).toMatch(/id="fixture-project"/);
  });
});
