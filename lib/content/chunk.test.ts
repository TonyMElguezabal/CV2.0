import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeFixtureRoot } from "./test-fixtures";
import { getContentChunks, MIN_CHUNK_LENGTH } from "./chunk.ts";

const TEST_MODELS = { llm: "test-llm-model", embedding: "test-embedding-model" };

// Compile-time only (never invoked) — models is a required field on the
// options object, so a caller can't silently produce chunks naming a stale
// model (design decision 1). Verified by `npx tsc --noEmit`, not Vitest,
// which strips types without checking them.
function _typeCheckModelsIsRequired(root: string): void {
  // @ts-expect-error — models is required; omitting it must fail to compile.
  getContentChunks({ contentRoot: root });
}
void _typeCheckModelsIsRequired;

describe("getContentChunks", () => {
  it("produces at least one chunk per real content source (profile, experience, project, skill, FAQ, meta)", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS });
      const sources = new Set(chunks.map((c) => c.source));
      expect(sources).toEqual(
        new Set(["profile", "experience", "project", "skill", "faq", "meta"]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("splits a chapter into separate chunks for context, actions, projects, leadership, and lessons", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS }).filter(
        (c) => c.source === "experience" && c.chapterId === "acme"
      );
      // context, actions, one project, leadership, lessons = 5 chunks for this fixture
      expect(chunks.length).toBeGreaterThanOrEqual(5);
      expect(chunks.some((c) => c.text.includes("Test context."))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Did a thing"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Led a thing"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("Test lesson."))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("gives every chunk a non-empty id, text, and anchor", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS });
      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.id.length).toBeGreaterThan(0);
        expect(chunk.text.length).toBeGreaterThan(0);
        expect(chunk.anchor.startsWith("#")).toBe(true);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("never emits a chunk shorter than MIN_CHUNK_LENGTH (a short chunk means content is thin and should be authored, not hidden)", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS });
      for (const chunk of chunks) {
        expect(chunk.text.trim().length).toBeGreaterThanOrEqual(MIN_CHUNK_LENGTH);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces one chunk per FAQ question/answer pair, anchored to #faq", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS }).filter((c) => c.source === "faq");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.text).toContain("Test question?");
      expect(chunks[0]?.text).toContain("Test answer.");
      expect(chunks[0]?.anchor).toBe("#faq");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces a mission/dates chunk with role, company, mission, raw dates, and a rendered range", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter(
        (c) => c.source === "experience" && c.chapterId === "acme" && c.id === "acme-mission-dates",
      );
      expect(chunks).toHaveLength(1);
      const text = chunks[0]?.text ?? "";
      expect(text).toContain("Engineer");
      expect(text).toContain("Acme");
      expect(text).toContain("Test mission statement.");
      expect(text).toContain("2020-01");
      expect(text).toContain("2021-06");
      expect(text).toContain("January 2020");
      expect(text).toContain("June 2021");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("renders an open-ended chapter's date range as '– present'", () => {
    const root = makeFixtureRoot();
    try {
      const openEndedExperience = `
company: Beta
role: Senior Engineer
mission: Ongoing mission statement.
dates:
  start: "2022-03"
context: Ongoing context.
responsibilities:
  - Doing a thing
projects: []
leadership:
  - Leading a thing
technologies:
  - TypeScript
lessons: Ongoing lesson.
`;
      writeFileSync(join(root, "experience", "beta.yaml"), openEndedExperience);

      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.id === "beta-mission-dates");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.text).toContain("March 2022 – present");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces a technologies chunk naming the chapter's technologies, role, and company", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.id === "acme-technologies");
      expect(chunks).toHaveLength(1);
      const text = chunks[0]?.text ?? "";
      expect(text).toContain("TypeScript");
      expect(text).toContain("Engineer");
      expect(text).toContain("Acme");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("emits no technologies chunk for a chapter with an empty technologies list", () => {
    const root = makeFixtureRoot();
    try {
      const noTechExperience = `
company: Gamma
role: Analyst
mission: No-tech mission statement.
dates:
  start: "2015-01"
  end: "2016-01"
context: No-tech context.
responsibilities:
  - Did a thing
projects: []
leadership:
  - Led a thing
technologies: []
lessons: No-tech lesson.
`;
      writeFileSync(join(root, "experience", "gamma.yaml"), noTechExperience);

      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.id === "gamma-technologies");
      expect(chunks).toHaveLength(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces a skill chunk containing the skill's summary prose alongside name and evidence", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "skill" && c.id === "skill-testing");
      expect(chunks).toHaveLength(1);
      const text = chunks[0]?.text ?? "";
      expect(text).toContain("Testing");
      expect(text).toContain("Test summary evidencing this skill.");
      expect(text).toContain("acme");
      expect(text).toContain("proj");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces 2-3 meta chunks naming the injected llm and embedding model ids", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "meta");
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.length).toBeLessThanOrEqual(3);
      const combinedText = chunks.map((c) => c.text).join("\n");
      expect(combinedText).toContain(TEST_MODELS.llm);
      expect(combinedText).toContain(TEST_MODELS.embedding);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("changes meta chunk text when the injected model ids change", () => {
    const root = makeFixtureRoot();
    try {
      const defaultChunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "meta");
      const otherModels = { llm: "other-llm-model", embedding: "other-embedding-model" };
      const otherChunks = getContentChunks({
        contentRoot: root,
        models: otherModels,
      }).filter((c) => c.source === "meta");

      const defaultText = defaultChunks.map((c) => c.text).join("\n");
      const otherText = otherChunks.map((c) => c.text).join("\n");
      expect(otherText).not.toBe(defaultText);
      expect(otherText).toContain(otherModels.llm);
      expect(otherText).toContain(otherModels.embedding);
      expect(otherText).not.toContain(TEST_MODELS.llm);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("anchors meta chunks at #chat", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "meta");
      for (const chunk of chunks) {
        expect(chunk.anchor).toBe("#chat");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces a profile chunk containing the positioning and summary", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "profile");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.text).toContain("Test positioning statement.");
      expect(chunks[0]?.text).toContain("Test summary.");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("anchors a project-card chunk to its own project id", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS }).filter((c) => c.source === "project");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.anchor).toBe("#proj");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
