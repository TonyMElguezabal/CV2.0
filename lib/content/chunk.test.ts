import { rmSync } from "node:fs";
import { makeFixtureRoot } from "./test-fixtures";
import { getContentChunks } from "./chunk.ts";

describe("getContentChunks", () => {
  it("produces at least one chunk per real content source (experience, project, skill, FAQ)", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks(root);
      const sources = new Set(chunks.map((c) => c.source));
      expect(sources).toEqual(new Set(["experience", "project", "skill", "faq"]));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("splits a chapter into separate chunks for context, actions, projects, leadership, and lessons", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks(root).filter(
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
      const chunks = getContentChunks(root);
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

  it("produces one chunk per FAQ question/answer pair, anchored to #faq", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks(root).filter((c) => c.source === "faq");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.text).toContain("Test question?");
      expect(chunks[0]?.text).toContain("Test answer.");
      expect(chunks[0]?.anchor).toBe("#faq");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("anchors a project-card chunk to its own project id", () => {
    const root = makeFixtureRoot();
    try {
      const chunks = getContentChunks(root).filter((c) => c.source === "project");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.anchor).toBe("#proj");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
