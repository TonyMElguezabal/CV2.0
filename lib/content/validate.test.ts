import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { validateContent } from "./validate";
import { VALID_EXPERIENCE, makeFixtureRoot } from "./test-fixtures";

describe("validateContent: real content tree", () => {
  it("reports valid with no errors against the real /content directory", () => {
    const result = validateContent();

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("validateContent: missing required field", () => {
  it("reports an error naming the file and field when an experience file is missing a required field", () => {
    const root = makeFixtureRoot();
    try {
      const brokenExperience = VALID_EXPERIENCE.replace(/^role: Engineer\n/m, "");
      writeFileSync(join(root, "experience", "acme.yaml"), brokenExperience);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          file: join("experience", "acme.yaml"),
          field: "role",
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("validateContent: dangling skill evidence references", () => {
  it("reports an error when a skill evidence ID matches no experience or project slug", () => {
    const root = makeFixtureRoot();
    try {
      const brokenSkills = `
- name: Testing
  evidence:
    - acme
    - does-not-exist
  summary: Test summary evidencing this skill.
`;
      writeFileSync(join(root, "skills.yaml"), brokenSkills);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          file: "skills.yaml",
          message: expect.stringContaining("does-not-exist"),
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports no dangling-reference error when every evidence ID resolves", () => {
    const root = makeFixtureRoot();
    try {
      const result = validateContent(root);

      expect(result.errors.filter((e) => e.file === "skills.yaml")).toEqual(
        [],
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports an error, distinct from a dangling reference, when a skill's evidence array is empty", () => {
    const root = makeFixtureRoot();
    try {
      const emptyEvidenceSkills = `
- name: Testing
  evidence: []
`;
      writeFileSync(join(root, "skills.yaml"), emptyEvidenceSkills);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          file: "skills.yaml",
          field: "0.evidence",
        }),
      );
      expect(
        result.errors.some((e) =>
          e.message.toLowerCase().includes("dangling"),
        ),
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports an error when a skill's summary is missing", () => {
    const root = makeFixtureRoot();
    try {
      const missingSummarySkills = `
- name: Testing
  evidence:
    - acme
`;
      writeFileSync(join(root, "skills.yaml"), missingSummarySkills);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          file: "skills.yaml",
          field: "0.summary",
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports an error when a skill's summary is empty or whitespace-only", () => {
    const root = makeFixtureRoot();
    try {
      const blankSummarySkills = `
- name: Testing
  evidence:
    - acme
  summary: "   "
`;
      writeFileSync(join(root, "skills.yaml"), blankSummarySkills);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          file: "skills.yaml",
          field: "0.summary",
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("validateContent: meta content source", () => {
  it("reports an error when content/meta.md is absent", () => {
    const root = makeFixtureRoot();
    try {
      rmSync(join(root, "meta.md"));

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ file: "meta.md" }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports an error when content/meta.md is missing a required frontmatter field", () => {
    const root = makeFixtureRoot();
    try {
      const brokenMeta = `---
topics:
  - architecture
---

## What This Site Is

Missing a title.
`;
      writeFileSync(join(root, "meta.md"), brokenMeta);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ file: "meta.md", field: "title" }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports an error when content/meta.md hardcodes the active LLM or embedding model identifier", () => {
    const root = makeFixtureRoot();
    try {
      const metaWithModelLiteral = `---
title: About This Site
topics:
  - architecture
---

## What This Site Is

This chatbot uses gpt-5.4-mini to generate answers.
`;
      writeFileSync(join(root, "meta.md"), metaWithModelLiteral);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ file: "meta.md" }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports no model-literal error when content/meta.md contains no model identifier", () => {
    const root = makeFixtureRoot();
    try {
      const result = validateContent(root);

      expect(
        result.errors.filter((e) => e.file === "meta.md"),
      ).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("validateContent: malformed dates", () => {
  it("reports an error naming the file and field when a date is not a real calendar date", () => {
    const root = makeFixtureRoot();
    try {
      const brokenExperience = VALID_EXPERIENCE.replace(
        'start: "2020-01"',
        'start: "2021-13"',
      );
      writeFileSync(join(root, "experience", "acme.yaml"), brokenExperience);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          file: join("experience", "acme.yaml"),
          field: "dates.start",
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reports no malformed-date error for valid YYYY-MM and YYYY-MM-DD dates", () => {
    const root = makeFixtureRoot();
    try {
      const fullDateExperience = VALID_EXPERIENCE.replace(
        'end: "2021-06"',
        'end: "2021-06-15"',
      );
      writeFileSync(join(root, "experience", "acme.yaml"), fullDateExperience);

      const result = validateContent(root);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("validateContent: error accumulation", () => {
  it("reports every issue across the tree, not only the first encountered", () => {
    const root = makeFixtureRoot();
    try {
      const brokenExperience = VALID_EXPERIENCE.replace(/^role: Engineer\n/m, "");
      writeFileSync(join(root, "experience", "acme.yaml"), brokenExperience);
      const brokenSkills = `
- name: Testing
  evidence:
    - acme
    - does-not-exist
`;
      writeFileSync(join(root, "skills.yaml"), brokenSkills);

      const result = validateContent(root);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ file: join("experience", "acme.yaml") }),
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ file: "skills.yaml" }),
      );
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
