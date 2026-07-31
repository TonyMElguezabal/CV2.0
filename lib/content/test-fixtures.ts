import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const VALID_PROFILE = `
name: Test Person
positioning: Test positioning statement. This fictional profile exists purely to exercise the content pipeline in unit tests.
summary: Test summary. It describes a fictional person's background at enough length to resemble a realistic profile summary.
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
context: Test context. This fictional company context is written with enough detail to resemble a real career chapter used only for testing.
responsibilities:
  - Did a thing that required significant fictional technical coordination and stakeholder communication across teams
projects:
  - title: Test project
    outcome: Test outcome achieved through fictional but detailed work spanning multiple quarters
    metrics:
      - "100% improvement in a fictional benchmark metric used only for testing"
leadership:
  - Led a thing that involved mentoring fictional teammates and improving fictional team processes over time
technologies:
  - TypeScript
lessons: Test lesson. This fictional lesson is phrased at greater length to resemble a realistic reflection written in prose.
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
  summary: Test summary evidencing this skill.
`;

export const VALID_FAQ = `# Frequently Asked Questions

### Test question?

Test answer. This fictional answer is written at enough length to resemble a realistic FAQ entry used only for testing.
`;

export const VALID_META = `---
title: About This Site
topics:
  - architecture
  - chatbot
---

## What This Site Is

Test site description. This fictional description is written at enough length to resemble real site-meta content used only for testing.

## How The Chatbot Works

Test chatbot pipeline description. This fictional description is written at enough length to resemble a real explanation of the retrieval pipeline.
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
  writeFileSync(join(root, "meta.md"), VALID_META);
  return root;
}
