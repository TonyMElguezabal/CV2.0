import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const VALID_PROFILE = `
name: Test Person
positioning: Test positioning statement.
summary: Test summary.
links:
  linkedin: https://linkedin.com/in/test
contact:
  email: test@example.com
  scheduling: https://cal.com/test
chat:
  greeting: Hi! Test greeting.
  tooltipLabel: chat with me
hero:
  terminalLines:
    - "$ whoami"
    - "test_person"
`;

export const VALID_EXPERIENCE = `
company: Acme
role: Engineer
mission: Test mission statement.
dates:
  start: "2020-01"
  end: "2021-06"
context: Test context.
responsibilities:
  - Did a thing
projects:
  - title: Test project
    outcome: Test outcome
    metrics:
      - "100% improvement"
leadership:
  - Led a thing
technologies:
  - TypeScript
lessons: Test lesson.
`;

export const VALID_PROJECT = `---
title: Test Project
company: acme
skills:
  - testing
metrics:
  - "100% improvement"
---

Problem. Approach. Outcome.
`;

export const VALID_SKILLS = `
- name: Testing
  evidence:
    - acme
    - proj
`;

export const VALID_FAQ = `# Frequently Asked Questions

### Test question?

Test answer.
`;

export function makeFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "content-fixture-"));
  mkdirSync(join(root, "experience"));
  mkdirSync(join(root, "projects"));
  writeFileSync(join(root, "profile.yaml"), VALID_PROFILE);
  writeFileSync(join(root, "experience", "acme.yaml"), VALID_EXPERIENCE);
  writeFileSync(join(root, "projects", "proj.md"), VALID_PROJECT);
  writeFileSync(join(root, "skills.yaml"), VALID_SKILLS);
  writeFileSync(join(root, "faq.md"), VALID_FAQ);
  return root;
}
