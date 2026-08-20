import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeFixtureRoot } from "./test-fixtures";
import { getContentChunks, chapterFramingPrefix, MIN_CHUNK_LENGTH } from "./chunk.ts";
import { getExperiences } from "./read.ts";

// The four chunk types chapterFramingPrefix() is prepended to
// (chatbot-era-collision-guard) — used below to strip the generated prefix
// before measuring authored content.
const FRAMED_SUFFIXES = ["-technologies", "-actions", "-leadership", "-lessons"];

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
  it("produces at least one chunk per real content source (profile, experience, project, skill, FAQ, meta, origins)", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS });
      const sources = new Set(chunks.map((c) => c.source));
      expect(sources).toEqual(
        new Set([
          "profile",
          "experience",
          "project",
          "skill",
          "faq",
          "meta",
          "origins",
        ]),
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

  it("never emits a chunk whose authored content is shorter than MIN_CHUNK_LENGTH (a short chunk means content is thin and should be authored, not hidden)", () => {
    // Measures authored content, not the full chunk text: a framed chunk's
    // generated prefix (role/company/date) must not be able to mask thin
    // authored content by padding the combined length past the threshold
    // (chatbot-era-collision-guard design.md Decision 4).
    const root = makeFixtureRoot();
    try {
      const experiences = getExperiences(root);
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS });
      for (const chunk of chunks) {
        const experience = chunk.chapterId
          ? experiences.find((e) => e.id === chunk.chapterId)
          : undefined;
        const isFramed =
          experience &&
          FRAMED_SUFFIXES.some((suffix) => chunk.id === `${chunk.chapterId}${suffix}`);
        const authoredText = isFramed
          ? chunk.text.slice(chapterFramingPrefix(experience).length)
          : chunk.text;
        expect(authoredText.trim().length).toBeGreaterThanOrEqual(MIN_CHUNK_LENGTH);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("detects thin authored content even when the generated framing pushes the combined chunk text past MIN_CHUNK_LENGTH", () => {
    const root = makeFixtureRoot();
    try {
      const thinExperience = `
company: International Business Machines Corporation
role: Senior Regional Delivery and Program Management Director
mission: Thin-content fixture mission statement, long enough on its own to be unrelated to this test's concern.
dates:
  start: "2010-01"
  end: "2011-01"
context: Thin-content fixture context, long enough on its own to be unrelated to this test's concern here.
responsibilities:
  - Did X
projects: []
leadership:
  - Led Y
technologies:
  - SQL
lessons: Learned Z.
`;
      writeFileSync(join(root, "experience", "delta.yaml"), thinExperience);

      const experiences = getExperiences(root);
      const delta = experiences.find((e) => e.id === "delta");
      expect(delta).toBeDefined();
      const prefix = chapterFramingPrefix(delta!);

      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.id === "delta-leadership");
      expect(chunks).toHaveLength(1);
      const chunk = chunks[0]!;

      // The long role/company/date framing alone pushes the combined text
      // past the threshold — proving that measuring the full chunk text
      // would have wrongly let this thin content through.
      expect(chunk.text.trim().length).toBeGreaterThanOrEqual(MIN_CHUNK_LENGTH);

      // The authored body underneath the framing ("Led Y") is thin and must
      // still be caught by content authors, not silently hidden.
      const authoredBody = chunk.text.slice(prefix.length).trim();
      expect(authoredBody.length).toBeLessThan(MIN_CHUNK_LENGTH);
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

  // chatbot-era-collision-guard (JOS-116): career-chapter chunks must be
  // self-describing in time and attribution, so a chunk retrieved in
  // isolation carries the era and employer it belongs to.
  it("names the chapter's rendered date range in the technologies chunk", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.id === "acme-technologies");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.text).toContain("January 2020 – June 2021");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("names the chapter's role and company in the actions, leadership, and lessons chunks", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) =>
        ["acme-actions", "acme-leadership", "acme-lessons"].includes(c.id),
      );
      expect(chunks).toHaveLength(3);
      for (const chunk of chunks) {
        expect(chunk.text).toContain("Engineer");
        expect(chunk.text).toContain("Acme");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("makes the framed chunk types (technologies, actions, leadership, lessons) attributable to a role, company, and date range in isolation", () => {
    // Scoped to the four chunk types this change frames (proposal.md "What
    // Changes"), not every experience chunk: -context and -mission-dates
    // already carried role/company attribution before this change, and
    // -project-N is out of scope.
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) =>
        [
          "acme-technologies",
          "acme-actions",
          "acme-leadership",
          "acme-lessons",
        ].includes(c.id),
      );
      expect(chunks).toHaveLength(4);
      for (const chunk of chunks) {
        expect(chunk.text).toContain("Engineer");
        expect(chunk.text).toContain("Acme");
        expect(chunk.text).toContain("January 2020 – June 2021");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("renders the same date form in the technologies chunk as in the mission-dates chunk", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({ contentRoot: root, models: TEST_MODELS });
      const missionDates = chunks.find((c) => c.id === "acme-mission-dates");
      const technologies = chunks.find((c) => c.id === "acme-technologies");
      const rangeMatch = missionDates?.text.match(
        /[A-Z][a-z]+ \d{4} – (?:[A-Z][a-z]+ \d{4}|present)/,
      );
      expect(rangeMatch).not.toBeNull();
      expect(technologies?.text).toContain(rangeMatch?.[0]);
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

  // origins-earlier-career (JOS-115)
  it("produces at least one chunk per origins entry, anchored to #origins", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "origins");
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks.every((c) => c.anchor === "#origins")).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("names an origins entry's period in its own chunk text, so the era is determinable in isolation", () => {
    const root = makeFixtureRoot();
    try {
      // Scoped to per-entry chunks, not the "origins-summary" overview
      // chunk — that one carries the record's overall span instead of any
      // single entry's period (see the dedicated test for it below).
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "origins" && c.id !== "origins-summary");
      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.text).toContain("age 16");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces an origins-summary chunk carrying the record's overall span, so it is retrievable independent of any single entry's period", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.id === "origins-summary");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.text).toContain("1994 – 2006");
      expect(chunks[0]!.anchor).toBe("#origins");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("still catches a thin origins entry against MIN_CHUNK_LENGTH — origins chunks have no generated framing to strip, so their full text is authored content", () => {
    const root = makeFixtureRoot();
    try {
      const thinOrigins = `
title: Origins
period: "age 9 – age 9"
summary: Test origins summary long enough to resemble a real formative-period record used only for testing.
entries:
  - id: thin-entry
    label: X
    period: age 9
    narrative: Too short.
`;
      writeFileSync(join(root, "origins.yaml"), thinOrigins);

      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.id === "origins-thin-entry");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.text.trim().length).toBeLessThan(MIN_CHUNK_LENGTH);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("produces multiple origins chunks when the record has multiple entries, one per entry", () => {
    const root = makeFixtureRoot();
    try {
      const multiEntryOrigins = `
title: Origins
period: "age 13 – age 17"
summary: Test origins summary long enough to resemble a real formative-period record used only for testing.
entries:
  - id: origin-one
    label: First origin entry
    period: age 13
    narrative: First fictional origins narrative, written at enough length to resemble real content used only for testing.
  - id: origin-two
    label: Second origin entry
    period: age 17
    narrative: Second fictional origins narrative, written at enough length to resemble real content used only for testing.
`;
      writeFileSync(join(root, "origins.yaml"), multiEntryOrigins);

      const chunks = getContentChunks({
        contentRoot: root,
        models: TEST_MODELS,
      }).filter((c) => c.source === "origins");
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.some((c) => c.text.includes("age 13"))).toBe(true);
      expect(chunks.some((c) => c.text.includes("age 17"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
