import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getExperiences, getSkills, getProjects } from "./read.ts";

const OLDER_EXPERIENCE = `
company: Acme
role: Engineer
mission: Older mission statement.
dates:
  start: "2018-01"
  end: "2020-06"
context: Older context.
responsibilities:
  - Did an older thing
projects:
  - title: Older project
    outcome: Older outcome
    metrics:
      - "50% improvement"
    projectId: older-project
leadership:
  - Led an older thing
technologies:
  - JavaScript
lessons: Older lesson.
`;

const NEWER_EXPERIENCE = `
company: Beta
role: Senior Engineer
mission: Newer mission statement.
dates:
  start: "2021-01"
context: Newer context.
responsibilities:
  - Did a newer thing
projects:
  - title: Newer project
    outcome: Newer outcome
    metrics:
      - "200% improvement"
leadership:
  - Led a newer thing
technologies:
  - TypeScript
lessons: Newer lesson.
`;

function makeExperienceFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "read-experience-fixture-"));
  mkdirSync(join(root, "experience"));
  writeFileSync(join(root, "experience", "acme.yaml"), OLDER_EXPERIENCE);
  writeFileSync(join(root, "experience", "beta.yaml"), NEWER_EXPERIENCE);
  return root;
}

describe("getExperiences", () => {
  it("returns one entry per file under content/experience/", () => {
    const root = makeExperienceFixtureRoot();
    const experiences = getExperiences(root);
    expect(experiences).toHaveLength(2);
  });

  it("computes each entry's id from its filename without extension", () => {
    const root = makeExperienceFixtureRoot();
    const experiences = getExperiences(root);
    const ids = experiences.map((experience) => experience.id).sort();
    expect(ids).toEqual(["acme", "beta"]);
  });

  it("sorts entries by dates.start descending (most recent first)", () => {
    const root = makeExperienceFixtureRoot();
    const experiences = getExperiences(root);
    expect(experiences.map((experience) => experience.id)).toEqual([
      "beta",
      "acme",
    ]);
  });

  it("parses each entry through ExperienceSchema, exposing its real fields", () => {
    const root = makeExperienceFixtureRoot();
    const experiences = getExperiences(root);
    const beta = experiences.find((experience) => experience.id === "beta");
    expect(beta?.company).toBe("Beta");
    expect(beta?.role).toBe("Senior Engineer");
    expect(beta?.dates.end).toBeUndefined();
  });

  it("round-trips an embedded project's optional projectId", () => {
    const root = makeExperienceFixtureRoot();
    const experiences = getExperiences(root);
    const acme = experiences.find((experience) => experience.id === "acme");
    expect(acme?.projects[0]?.projectId).toBe("older-project");
  });

  it("leaves projectId undefined when an embedded project doesn't set it", () => {
    const root = makeExperienceFixtureRoot();
    const experiences = getExperiences(root);
    const beta = experiences.find((experience) => experience.id === "beta");
    expect(beta?.projects[0]?.projectId).toBeUndefined();
  });
});

const SKILLS_FIXTURE = `
- name: Testing
  evidence:
    - acme
    - beta
- name: Leadership
  evidence:
    - beta
`;

function makeSkillsFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "read-skills-fixture-"));
  writeFileSync(join(root, "skills.yaml"), SKILLS_FIXTURE);
  return root;
}

describe("getSkills", () => {
  it("returns one entry per skill in content/skills.yaml", () => {
    const root = makeSkillsFixtureRoot();
    const skills = getSkills(root);
    expect(skills).toHaveLength(2);
  });

  it("parses each entry through SkillSchema, exposing its real fields", () => {
    const root = makeSkillsFixtureRoot();
    const skills = getSkills(root);
    const leadership = skills.find((skill) => skill.name === "Leadership");
    expect(leadership?.evidence).toEqual(["beta"]);
  });

  it("preserves multiple evidence ids for a single skill", () => {
    const root = makeSkillsFixtureRoot();
    const skills = getSkills(root);
    const testing = skills.find((skill) => skill.name === "Testing");
    expect(testing?.evidence).toEqual(["acme", "beta"]);
  });
});

const ORDERED_PROJECT = `---
title: Ordered Project
company: Acme
skills:
  - Testing
metrics:
  - "100% improvement"
---

## Problem

This is the problem section.

## Approach

This is the approach section.

## Outcome

This is the outcome section.
`;

const REORDERED_PROJECT = `---
title: Reordered Project
company: Beta
skills:
  - Testing
metrics:
  - "50% improvement"
---

## Outcome

Reordered outcome text.

## Problem

Reordered problem text.

## Approach

Reordered approach text.
`;

function makeProjectsFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "read-projects-fixture-"));
  mkdirSync(join(root, "projects"));
  writeFileSync(join(root, "projects", "ordered.md"), ORDERED_PROJECT);
  writeFileSync(join(root, "projects", "reordered.md"), REORDERED_PROJECT);
  return root;
}

describe("getProjects", () => {
  it("returns one entry per file under content/projects/", () => {
    const root = makeProjectsFixtureRoot();
    const projects = getProjects(root);
    expect(projects).toHaveLength(2);
  });

  it("computes each entry's id from its filename without extension", () => {
    const root = makeProjectsFixtureRoot();
    const projects = getProjects(root);
    const ids = projects.map((project) => project.id).sort();
    expect(ids).toEqual(["ordered", "reordered"]);
  });

  it("parses frontmatter through ProjectSchema, exposing its real fields", () => {
    const root = makeProjectsFixtureRoot();
    const projects = getProjects(root);
    const ordered = projects.find((project) => project.id === "ordered");
    expect(ordered?.title).toBe("Ordered Project");
    expect(ordered?.company).toBe("Acme");
    expect(ordered?.skills).toEqual(["Testing"]);
    expect(ordered?.metrics).toEqual(["100% improvement"]);
  });

  it("splits the body into problem/approach/outcome by ## heading, regardless of source order", () => {
    const root = makeProjectsFixtureRoot();
    const projects = getProjects(root);
    const reordered = projects.find((project) => project.id === "reordered");
    expect(reordered?.problem).toContain("Reordered problem text.");
    expect(reordered?.approach).toContain("Reordered approach text.");
    expect(reordered?.outcome).toContain("Reordered outcome text.");
  });
});
