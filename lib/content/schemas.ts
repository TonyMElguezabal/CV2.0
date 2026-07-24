import { z } from "zod";

function isValidDateString(value: string): boolean {
  const fullMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value);
  const match = fullMatch ?? monthMatch;
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = fullMatch ? Number(match[3]) : 1;

  if (month < 1 || month > 12) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const dateStringSchema = z.string().refine(isValidDateString, {
  message: "must be a valid YYYY-MM or YYYY-MM-DD calendar date",
});

export const ProfileLinksSchema = z.object({
  linkedin: z.string(),
  github: z.string().optional(),
  website: z.string().optional(),
});

export const ProfileContactSchema = z.object({
  email: z.string(),
  scheduling: z.string(),
});

export const ChatSchema = z.object({
  greeting: z.string(),
  tooltipLabel: z.string(),
});

export const HeroSchema = z.object({
  terminalLines: z.array(z.string()).min(1),
});

export const ProfileSchema = z.object({
  name: z.string(),
  positioning: z.string(),
  summary: z.string(),
  links: ProfileLinksSchema,
  contact: ProfileContactSchema,
  chat: ChatSchema,
  hero: HeroSchema,
});

export const ExperienceDatesSchema = z.object({
  start: dateStringSchema,
  end: dateStringSchema.optional(),
});

export const ExperienceProjectSchema = z.object({
  title: z.string(),
  outcome: z.string(),
  metrics: z.array(z.string()),
  projectId: z.string().optional(),
});

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  mission: z.string(),
  dates: ExperienceDatesSchema,
  context: z.string(),
  responsibilities: z.array(z.string()),
  projects: z.array(ExperienceProjectSchema),
  leadership: z.array(z.string()),
  technologies: z.array(z.string()),
  lessons: z.string(),
});

export const ProjectSchema = z.object({
  title: z.string(),
  company: z.string(),
  skills: z.array(z.string()),
  metrics: z.array(z.string()),
});

export const SkillSchema = z.object({
  name: z.string(),
  evidence: z.array(z.string()).min(1),
});
