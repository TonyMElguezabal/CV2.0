import { readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { parse as parseYaml } from "yaml";
import matter from "gray-matter";
import {
  ExperienceSchema,
  ProfileSchema,
  SkillSchema,
  ProjectSchema,
  MetaSchema,
} from "./schemas.ts";
import type { Experience, Profile, Skill, Project, Meta } from "./types.ts";

// process.cwd(), not import.meta.dirname: this module is imported into
// Next.js's bundle (unlike validate.ts/cli.ts, which only run via raw
// `node`), and bundlers don't reliably populate import.meta.dirname.
// process.cwd() is the standard Next.js pattern for reading local content
// at request/build time — Next always runs with cwd set to the project root.
const defaultContentRoot = join(process.cwd(), "content");

export function getProfile(contentRoot: string = defaultContentRoot): Profile {
  const raw = readFileSync(join(contentRoot, "profile.yaml"), "utf-8");
  return ProfileSchema.parse(parseYaml(raw));
}

export interface ExperienceWithId extends Experience {
  id: string;
}

export function getExperiences(
  contentRoot: string = defaultContentRoot
): ExperienceWithId[] {
  const experienceDir = join(contentRoot, "experience");
  const experiences = readdirSync(experienceDir).map((filename) => {
    const raw = readFileSync(join(experienceDir, filename), "utf-8");
    const experience = ExperienceSchema.parse(parseYaml(raw));
    return { ...experience, id: basename(filename, extname(filename)) };
  });

  return experiences.sort((a, b) => b.dates.start.localeCompare(a.dates.start));
}

export function getSkills(contentRoot: string = defaultContentRoot): Skill[] {
  const raw = readFileSync(join(contentRoot, "skills.yaml"), "utf-8");
  return SkillSchema.array().parse(parseYaml(raw));
}

export interface ProjectWithId extends Project {
  id: string;
  problem: string;
  approach: string;
  outcome: string;
}

// Splits a markdown body into named sections by `## <Name>` headings,
// keyed by lowercased heading text, regardless of the order those sections
// appear in the source file.
function splitMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = markdown.split(/^##\s+(.+)$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const heading = (parts[i] ?? "").trim().toLowerCase();
    const content = (parts[i + 1] ?? "").trim();
    sections[heading] = content;
  }
  return sections;
}

export function getProjects(
  contentRoot: string = defaultContentRoot
): ProjectWithId[] {
  const projectsDir = join(contentRoot, "projects");
  return readdirSync(projectsDir).map((filename) => {
    const raw = readFileSync(join(projectsDir, filename), "utf-8");
    const { data, content } = matter(raw);
    const project = ProjectSchema.parse(data);
    const sections = splitMarkdownSections(content);
    return {
      ...project,
      id: basename(filename, extname(filename)),
      problem: sections.problem ?? "",
      approach: sections.approach ?? "",
      outcome: sections.outcome ?? "",
    };
  });
}

export interface MetaWithSections extends Meta {
  sections: Record<string, string>;
}

export function getMeta(contentRoot: string = defaultContentRoot): MetaWithSections {
  const raw = readFileSync(join(contentRoot, "meta.md"), "utf-8");
  const { data, content } = matter(raw);
  const meta = MetaSchema.parse(data);
  return { ...meta, sections: splitMarkdownSections(content) };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function getFaq(contentRoot: string = defaultContentRoot): FaqEntry[] {
  const raw = readFileSync(join(contentRoot, "faq.md"), "utf-8");
  const parts = raw.split(/^###\s+(.+)$/m);
  const entries: FaqEntry[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const question = (parts[i] ?? "").trim();
    const answer = (parts[i + 1] ?? "").trim();
    entries.push({ question, answer });
  }
  return entries;
}
