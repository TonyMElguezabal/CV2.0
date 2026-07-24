import { readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { parse as parseYaml } from "yaml";
import matter from "gray-matter";
import type { Profile, Experience, Project, Skill } from "./types";
import { makeFixtureRoot } from "./test-fixtures";

describe("content-model: profile", () => {
  it("parses profile.yaml into the expected Profile shape", () => {
    const root = makeFixtureRoot();
    try {
      const raw = readFileSync(join(root, "profile.yaml"), "utf-8");
      const profile = parseYaml(raw) as Profile;

      expect(profile.name).toEqual(expect.any(String));
      expect(profile.positioning).toEqual(expect.any(String));
      expect(profile.summary).toEqual(expect.any(String));
      expect(profile.links).toEqual(expect.any(Object));
      expect(profile.contact).toEqual(expect.any(Object));
      expect(profile.chat.greeting).toEqual(expect.any(String));
      expect(profile.chat.tooltipLabel).toEqual(expect.any(String));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("content-model: experience", () => {
  it("parses an experience file into the expected Experience shape, with chapter ID from its filename", () => {
    const root = makeFixtureRoot();
    try {
      const filenames = readdirSync(join(root, "experience"));
      expect(filenames.length).toBeGreaterThan(0);
      const filename = filenames[0]!;
      const path = join(root, "experience", filename);
      const raw = readFileSync(path, "utf-8");
      const experience = parseYaml(raw) as Experience;

      expect(experience.company).toEqual(expect.any(String));
      expect(experience.role).toEqual(expect.any(String));
      expect(experience.mission).toEqual(expect.any(String));
      expect(experience.dates).toEqual(expect.any(Object));
      expect(experience.context).toEqual(expect.any(String));
      expect(experience.responsibilities.length).toBeGreaterThan(0);
      expect(experience.projects.length).toBeGreaterThan(0);
      expect(experience.leadership.length).toBeGreaterThan(0);
      expect(experience.technologies.length).toBeGreaterThan(0);
      expect(experience.lessons).toEqual(expect.any(String));

      const chapterId = basename(path, extname(path));
      expect(chapterId).toBe(basename(filename, extname(filename)));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("content-model: project", () => {
  it("parses a project file's frontmatter and body into the expected Project shape, with project ID from its filename", () => {
    const root = makeFixtureRoot();
    try {
      const filenames = readdirSync(join(root, "projects"));
      expect(filenames.length).toBeGreaterThan(0);
      const filename = filenames[0]!;
      const path = join(root, "projects", filename);
      const raw = readFileSync(path, "utf-8");
      const { data, content } = matter(raw);
      const frontmatter = data as Project;

      expect(frontmatter.title).toEqual(expect.any(String));
      expect(frontmatter.company).toEqual(expect.any(String));
      expect(frontmatter.skills.length).toBeGreaterThan(0);
      expect(frontmatter.metrics.length).toBeGreaterThan(0);

      expect(content.toLowerCase()).toContain("problem");
      expect(content.toLowerCase()).toContain("approach");
      expect(content.toLowerCase()).toContain("outcome");

      const projectId = basename(path, extname(path));
      expect(projectId).toBe(basename(filename, extname(filename)));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("content-model: skills", () => {
  it("resolves every skills.yaml evidence reference to an existing experience or project slug", () => {
    const root = makeFixtureRoot();
    try {
      const raw = readFileSync(join(root, "skills.yaml"), "utf-8");
      const skills = parseYaml(raw) as Skill[];

      expect(skills.length).toBeGreaterThan(0);

      const experienceSlugs = readdirSync(join(root, "experience")).map((f) =>
        basename(f, extname(f)),
      );
      const projectSlugs = readdirSync(join(root, "projects")).map((f) =>
        basename(f, extname(f)),
      );
      const knownSlugs = new Set([...experienceSlugs, ...projectSlugs]);

      for (const skill of skills) {
        expect(skill.name).toEqual(expect.any(String));
        expect(skill.evidence.length).toBeGreaterThan(0);
        for (const evidenceId of skill.evidence) {
          expect(knownSlugs.has(evidenceId)).toBe(true);
        }
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("content-model: faq", () => {
  it("contains at least one parsable question/answer pair", () => {
    const root = makeFixtureRoot();
    try {
      const raw = readFileSync(join(root, "faq.md"), "utf-8");

      const questionBlocks = raw
        .split(/^### /m)
        .slice(1)
        .map((block) => block.trim());

      expect(questionBlocks.length).toBeGreaterThan(0);
      for (const block of questionBlocks) {
        const lines = block.split("\n");
        const question = lines[0];
        const answerLines = lines.slice(1);
        expect(question).toBeDefined();
        expect((question ?? "").trim().length).toBeGreaterThan(0);
        expect(answerLines.join("\n").trim().length).toBeGreaterThan(0);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("content-model: file structure", () => {
  it("has every content type present as a structured file, separate from any UI component", () => {
    const root = makeFixtureRoot();
    try {
      expect(existsSync(join(root, "profile.yaml"))).toBe(true);
      expect(readdirSync(join(root, "experience")).length).toBeGreaterThan(0);
      expect(readdirSync(join(root, "projects")).length).toBeGreaterThan(0);
      expect(existsSync(join(root, "skills.yaml"))).toBe(true);
      expect(existsSync(join(root, "faq.md"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
