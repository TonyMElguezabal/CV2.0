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
