import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getExperiences } from "./read.ts";

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
});
