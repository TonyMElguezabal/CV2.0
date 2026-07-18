export interface ProfileLinks {
  linkedin: string;
  github?: string;
  website?: string;
}

export interface ProfileContact {
  email: string;
  scheduling: string;
}

export interface Profile {
  name: string;
  positioning: string;
  summary: string;
  links: ProfileLinks;
  contact: ProfileContact;
}

export interface ExperienceDates {
  start: string;
  end?: string;
}

export interface ExperienceProject {
  title: string;
  outcome: string;
  metrics: string[];
}

export interface Experience {
  role: string;
  dates: ExperienceDates;
  context: string;
  responsibilities: string[];
  projects: ExperienceProject[];
  leadership: string[];
  technologies: string[];
  lessons: string;
}

export interface Project {
  title: string;
  company: string;
  skills: string[];
  metrics: string[];
}

export interface Skill {
  name: string;
  evidence: string[];
}
