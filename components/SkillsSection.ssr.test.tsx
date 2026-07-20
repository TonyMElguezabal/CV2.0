import { renderToStaticMarkup } from "react-dom/server";
import { SkillsSection } from "./SkillsSection";
import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { Skill } from "@/lib/content/types.ts";

const FIXTURE_EXPERIENCE: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Fixture mission.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Fixture context.",
  responsibilities: ["Fixture responsibility"],
  projects: [
    { title: "Fixture project", outcome: "Fixture outcome", metrics: ["10%"] },
  ],
  leadership: ["Fixture leadership"],
  technologies: ["FixtureLang"],
  lessons: "Fixture lesson.",
};

const FIXTURE_SKILL: Skill = {
  name: "Fixture Skill",
  evidence: ["acme"],
};

describe("SkillsSection — server-rendered (no-JS) output", () => {
  it("renders skills and real evidence hrefs in the static-rendered HTML, without any client-side rendering step", () => {
    const html = renderToStaticMarkup(
      <SkillsSection skills={[FIXTURE_SKILL]} experiences={[FIXTURE_EXPERIENCE]} />
    );

    expect(html).toContain("Fixture Skill");
    expect(html).toContain('href="#acme-projects"');
  });
});
