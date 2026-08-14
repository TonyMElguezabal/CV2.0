// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { siteNavItems } from "./siteNavigation";
import { CareerChapters } from "./CareerChapters";
import { SkillsSection } from "./SkillsSection";
import { ProjectsSection } from "./ProjectsSection";
import { ContactSection } from "./ContactSection";
import type { ExperienceWithId, ProjectWithId } from "@/lib/content/read.ts";
import type { Profile, Skill } from "@/lib/content/types.ts";

const FIXTURE_EXPERIENCE: ExperienceWithId = {
  id: "fixture-co",
  company: "Fixture Co",
  role: "Engineer",
  mission: "Fixture mission.",
  dates: { start: "2020-01" },
  context: "Fixture context.",
  responsibilities: ["Fixture responsibility"],
  projects: [
    { title: "Fixture project", outcome: "Fixture outcome", metrics: ["1%"] },
  ],
  leadership: ["Fixture leadership"],
  technologies: ["FixtureLang"],
  lessons: "Fixture lesson.",
};

const FIXTURE_SKILL: Skill = {
  name: "Fixture Skill",
  evidence: ["fixture-co"],
  summary: "Fixture summary.",
};

const FIXTURE_PROJECT: ProjectWithId = {
  id: "fixture-project",
  title: "Fixture Project",
  company: "Fixture Co",
  skills: ["Fixture Skill"],
  metrics: ["Fixture metric"],
  problem: "Fixture problem.",
  approach: "Fixture approach.",
  outcome: "Fixture outcome.",
};

const FIXTURE_CONTACT: Pick<Profile, "contact" | "links"> = {
  contact: {
    email: "fixture@example.com",
    scheduling: "https://cal.com/fixture",
  },
  links: { linkedin: "https://www.linkedin.com/in/fixture" },
};

describe("site navigation anchor targets", () => {
  it("every nav item's href fragment resolves to an element that exists in the document", () => {
    const { container } = render(
      <main>
        <CareerChapters experiences={[FIXTURE_EXPERIENCE]} />
        <SkillsSection
          skills={[FIXTURE_SKILL]}
          experiences={[FIXTURE_EXPERIENCE]}
        />
        <ProjectsSection projects={[FIXTURE_PROJECT]} />
        <ContactSection {...FIXTURE_CONTACT} />
      </main>
    );

    for (const item of siteNavItems) {
      const id = item.href.replace(/^#/, "");
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });
});
