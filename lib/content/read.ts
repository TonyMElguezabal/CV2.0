import { readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { parse as parseYaml } from "yaml";
import { ExperienceSchema, ProfileSchema, SkillSchema } from "./schemas.ts";
import type { Experience, Profile, Skill } from "./types.ts";

// process.cwd(), not import.meta.dirname: this module is imported into
// Next.js's bundle (unlike validate.ts/cli.ts, which only run via raw
// `node`), and bundlers don't reliably populate import.meta.dirname.
// process.cwd() is the standard Next.js pattern for reading local content
// at request/build time — Next always runs with cwd set to the project root.
const defaultContentRoot = join(process.cwd(), "content");

export function getProfile(): Profile {
  const raw = readFileSync(join(defaultContentRoot, "profile.yaml"), "utf-8");
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
