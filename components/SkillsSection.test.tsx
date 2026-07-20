// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { SkillsSection } from "./SkillsSection";
import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { Skill } from "@/lib/content/types.ts";

const ORACLE: ExperienceWithId = {
  id: "oracle",
  company: "Oracle Corporation",
  role: "Senior Software Development Manager",
  mission: "Fixture mission.",
  dates: { start: "2021-11" },
  context: "Fixture context.",
  responsibilities: ["Fixture responsibility"],
  projects: [
    { title: "Fixture project", outcome: "Fixture outcome", metrics: ["10%"] },
  ],
  leadership: ["Fixture leadership"],
  technologies: ["Python"],
  lessons: "Fixture lesson.",
};

const ENVATO: ExperienceWithId = {
  id: "envato",
  company: "Envato (Placeit.net)",
  role: "Project Delivery Manager",
  mission: "Fixture mission.",
  dates: { start: "2019-03", end: "2021-11" },
  context: "Fixture context.",
  responsibilities: ["Fixture responsibility"],
  projects: [
    { title: "Fixture project", outcome: "Fixture outcome", metrics: ["20%"] },
  ],
  leadership: ["Fixture leadership"],
  technologies: ["JavaScript"],
  lessons: "Fixture lesson.",
};

const SINGLE_EVIDENCE_SKILL: Skill = {
  name: "Technical Program Leadership",
  evidence: ["oracle"],
};

const MULTI_EVIDENCE_SKILL: Skill = {
  name: "Stakeholder Management",
  evidence: ["oracle", "envato"],
};

describe("SkillsSection", () => {
  it("renders one entry per skill passed in", () => {
    render(
      <SkillsSection
        skills={[SINGLE_EVIDENCE_SKILL, MULTI_EVIDENCE_SKILL]}
        experiences={[ORACLE, ENVATO]}
      />
    );
    expect(
      screen.getByText("Technical Program Leadership")
    ).toBeInTheDocument();
    expect(screen.getByText("Stakeholder Management")).toBeInTheDocument();
  });

  it("renders one evidence link for a skill with a single-entry evidence array", () => {
    render(
      <SkillsSection skills={[SINGLE_EVIDENCE_SKILL]} experiences={[ORACLE]} />
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "#oracle-projects");
  });

  it("renders one evidence link per id for a skill with a multi-entry evidence array", () => {
    render(
      <SkillsSection
        skills={[MULTI_EVIDENCE_SKILL]}
        experiences={[ORACLE, ENVATO]}
      />
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.getAttribute("href")).sort()).toEqual([
      "#envato-projects",
      "#oracle-projects",
    ]);
  });

  it("gives each evidence link an accessible name including the skill and the chapter", () => {
    render(
      <SkillsSection skills={[SINGLE_EVIDENCE_SKILL]} experiences={[ORACLE]} />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAccessibleName(
      "Technical Program Leadership — evidenced by Senior Software Development Manager at Oracle Corporation"
    );
  });
});
