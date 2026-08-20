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
  MetaSchema,
  OriginsSchema,
} from "./schemas.ts";
import { OPENAI_MODEL, EMBEDDING_MODEL } from "../rag/models.ts";

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

  const metaPath = join(contentRoot, "meta.md");
  if (existsSync(metaPath)) {
    const raw = readFileSync(metaPath, "utf-8");
    const { data, content } = matter(raw);
    const result = MetaSchema.safeParse(data);
    if (!result.success) {
      errors.push(...zodIssuesToErrors("meta.md", result.error.issues));
    }
    for (const modelLiteral of [OPENAI_MODEL, EMBEDDING_MODEL]) {
      if (content.includes(modelLiteral)) {
        errors.push({
          file: "meta.md",
          message: `hardcodes model identifier "${modelLiteral}" — let it be injected at index-build time instead of writing it into content`,
        });
      }
    }
  } else {
    errors.push({ file: "meta.md", message: "file is missing" });
  }

  const originsPath = join(contentRoot, "origins.yaml");
  if (existsSync(originsPath)) {
    const parsed = parseYaml(readFileSync(originsPath, "utf-8"));
    const result = OriginsSchema.safeParse(parsed);
    if (!result.success) {
      errors.push(...zodIssuesToErrors("origins.yaml", result.error.issues));
    }
  } else {
    errors.push({ file: "origins.yaml", message: "file is missing" });
  }

  // Origins entry ids are deliberately excluded from `knownSlugs` above —
  // an origins entry can never satisfy a skill's evidence[] reference
  // (origins-earlier-career design.md Decision 5: legacy tooling stays
  // narrative and is never claimed as a current skill). No special-case
  // code needed: skills.yaml's existing dangling-reference check above
  // already rejects an origins id, since it was never added to the set of
  // ids a skill is permitted to reference.

  return { valid: errors.length === 0, errors };
}
