import type { z } from "zod";
import type {
  ProfileLinksSchema,
  ProfileContactSchema,
  ChatSchema,
  ProfileSchema,
  ExperienceDatesSchema,
  ExperienceProjectSchema,
  ExperienceSchema,
  ProjectSchema,
  SkillSchema,
} from "./schemas";

export type ProfileLinks = z.infer<typeof ProfileLinksSchema>;
export type ProfileContact = z.infer<typeof ProfileContactSchema>;
export type Chat = z.infer<typeof ChatSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export type ExperienceDates = z.infer<typeof ExperienceDatesSchema>;
export type ExperienceProject = z.infer<typeof ExperienceProjectSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;

export type Project = z.infer<typeof ProjectSchema>;

export type Skill = z.infer<typeof SkillSchema>;
