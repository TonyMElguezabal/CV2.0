import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getExperiences,
  getSkills,
  getProjects,
  getMeta,
  getOrigins,
} from "./read.ts";

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
  summary: Testing skill summary.
- name: Leadership
  evidence:
    - beta
  summary: Leadership skill summary.
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

const META_FIXTURE = `---
title: About This Site
topics:
  - architecture
  - chatbot
---

## What This Site Is

This site is a content-first application.

## How The Chatbot Works

It retrieves matching content and generates a grounded answer.
`;

function makeMetaFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "read-meta-fixture-"));
  writeFileSync(join(root, "meta.md"), META_FIXTURE);
  return root;
}

describe("getMeta", () => {
  it("returns parsed frontmatter plus body sections from a fixture content root", () => {
    const root = makeMetaFixtureRoot();
    const meta = getMeta(root);
    expect(meta.title).toBe("About This Site");
    expect(meta.topics).toEqual(["architecture", "chatbot"]);
    expect(meta.sections["what this site is"]).toContain(
      "This site is a content-first application.",
    );
    expect(meta.sections["how the chatbot works"]).toContain(
      "It retrieves matching content and generates a grounded answer.",
    );
  });
});

// origins-earlier-career (JOS-115): array order is authored display order,
// deliberately not sorted — the section is a narrative arc (design.md
// Decision 3), unlike getExperiences()'s reverse-chronological sort.
const ORIGINS_FIXTURE = `
title: Origins
period: "1994 – 2001"
summary: A formative period before the résumé begins.
entries:
  - id: first-entry
    label: First Entry
    period: "age 13"
    narrative: The first thing that happened, described in enough detail to resemble a real origins entry used only for testing.
  - id: second-entry
    label: Second Entry
    period: "1999–2001"
    organization: Some Company
    narrative: The second thing that happened, described in enough detail to resemble a real origins entry used only for testing.
    highlight: A notable moment worth calling out on its own.
    technologies:
      - Clipper
`;

function makeOriginsFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "read-origins-fixture-"));
  writeFileSync(join(root, "origins.yaml"), ORIGINS_FIXTURE);
  return root;
}

describe("getOrigins", () => {
  it("returns the record's title, summary, and entries from content/origins.yaml", () => {
    const root = makeOriginsFixtureRoot();
    const origins = getOrigins(root);
    expect(origins.title).toBe("Origins");
    expect(origins.period).toBe("1994 – 2001");
    expect(origins.summary).toContain("formative period");
    expect(origins.entries).toHaveLength(2);
  });

  it("preserves entries in authored order, not sorted by period", () => {
    const root = makeOriginsFixtureRoot();
    const origins = getOrigins(root);
    expect(origins.entries.map((entry) => entry.id)).toEqual([
      "first-entry",
      "second-entry",
    ]);
  });

  it("parses each entry through OriginEntrySchema, exposing its real fields including optional ones", () => {
    const root = makeOriginsFixtureRoot();
    const origins = getOrigins(root);
    const second = origins.entries.find((entry) => entry.id === "second-entry");
    expect(second?.label).toBe("Second Entry");
    expect(second?.period).toBe("1999–2001");
    expect(second?.organization).toBe("Some Company");
    expect(second?.highlight).toBe("A notable moment worth calling out on its own.");
    expect(second?.technologies).toEqual(["Clipper"]);
  });

  it("leaves optional fields undefined when an entry doesn't set them", () => {
    const root = makeOriginsFixtureRoot();
    const origins = getOrigins(root);
    const first = origins.entries.find((entry) => entry.id === "first-entry");
    expect(first?.organization).toBeUndefined();
    expect(first?.highlight).toBeUndefined();
    expect(first?.technologies).toBeUndefined();
  });

  it("validates approximate, non-calendar period labels — no month-precise date required (design.md Decision 2)", () => {
    const root = mkdtempSync(join(tmpdir(), "read-origins-approx-fixture-"));
    const approximatePeriods = `
title: Origins
period: "1994 – 2001"
summary: A formative period expressed only in approximate terms, on purpose.
entries:
  - id: approx-age
    label: An entry dated only by age
    period: "age 16"
    narrative: This entry's period is an age, not a calendar date, and must still validate successfully.
  - id: approx-range
    label: An entry dated only by year range
    period: "1999–2001"
    narrative: This entry's period is a bare year range with no month precision, and must still validate successfully.
`;
    writeFileSync(join(root, "origins.yaml"), approximatePeriods);

    expect(() => getOrigins(root)).not.toThrow();
    const origins = getOrigins(root);
    expect(origins.entries.map((entry) => entry.period)).toEqual([
      "age 16",
      "1999–2001",
    ]);
  });
});

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
