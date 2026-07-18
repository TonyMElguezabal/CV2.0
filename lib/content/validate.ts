import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import matter from "gray-matter";
import { z } from "zod";
import {
  ProfileSchema,
  ExperienceSchema,
  ProjectSchema,
  SkillSchema,
} from "./schemas.ts";

export interface ValidationError {
  file: string;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const defaultContentRoot = resolve(import.meta.dirname, "..", "..", "content");

function zodIssuesToErrors(
  file: string,
  issues: z.ZodIssue[],
): ValidationError[] {
  return issues.map((issue) => ({
    file,
    field: issue.path.length > 0 ? issue.path.join(".") : undefined,
    message: issue.message,
  }));
}

export function validateContent(
  contentRoot: string = defaultContentRoot,
): ValidationResult {
  const errors: ValidationError[] = [];

  const profilePath = join(contentRoot, "profile.yaml");
  if (existsSync(profilePath)) {
    const parsed = parseYaml(readFileSync(profilePath, "utf-8"));
    const result = ProfileSchema.safeParse(parsed);
    if (!result.success) {
      errors.push(...zodIssuesToErrors("profile.yaml", result.error.issues));
    }
  } else {
    errors.push({ file: "profile.yaml", message: "file is missing" });
  }

  const experienceDir = join(contentRoot, "experience");
  const experienceSlugs: string[] = [];
  if (existsSync(experienceDir)) {
    for (const filename of readdirSync(experienceDir)) {
      const relativePath = join("experience", filename);
      experienceSlugs.push(basename(filename, extname(filename)));
      const parsed = parseYaml(
        readFileSync(join(experienceDir, filename), "utf-8"),
      );
      const result = ExperienceSchema.safeParse(parsed);
      if (!result.success) {
        errors.push(...zodIssuesToErrors(relativePath, result.error.issues));
      }
    }
  }

  const projectsDir = join(contentRoot, "projects");
  const projectSlugs: string[] = [];
  if (existsSync(projectsDir)) {
    for (const filename of readdirSync(projectsDir)) {
      const relativePath = join("projects", filename);
      projectSlugs.push(basename(filename, extname(filename)));
      const { data } = matter(readFileSync(join(projectsDir, filename), "utf-8"));
      const result = ProjectSchema.safeParse(data);
      if (!result.success) {
        errors.push(...zodIssuesToErrors(relativePath, result.error.issues));
      }
    }
  }

  const knownSlugs = new Set([...experienceSlugs, ...projectSlugs]);
  const skillsPath = join(contentRoot, "skills.yaml");
  if (existsSync(skillsPath)) {
    const parsed = parseYaml(readFileSync(skillsPath, "utf-8"));
    const result = z.array(SkillSchema).safeParse(parsed);
    if (!result.success) {
      errors.push(...zodIssuesToErrors("skills.yaml", result.error.issues));
    } else {
      result.data.forEach((skill, index) => {
        for (const evidenceId of skill.evidence) {
          if (!knownSlugs.has(evidenceId)) {
            errors.push({
              file: "skills.yaml",
              field: `${index}.evidence`,
              message: `dangling reference: no experience or project matches "${evidenceId}"`,
            });
          }
        }
      });
    }
  } else {
    errors.push({ file: "skills.yaml", message: "file is missing" });
  }

  return { valid: errors.length === 0, errors };
}
