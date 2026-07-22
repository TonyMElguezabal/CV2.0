import { getExperiences, getSkills, getProjects, getFaq } from "./read.ts";

export interface ContentChunk {
  id: string;
  text: string;
  source: "experience" | "project" | "skill" | "faq";
  chapterId?: string;
  anchor: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Chunks by semantic unit (chapter section, project, leadership story, FAQ
// pair), per PRD §7 — each chunk carries source/chapter/anchor metadata so
// retrieved answers can cite and deep-link into the site. See design.md in
// openspec/changes/llm-retrieval-spike.
export function getContentChunks(contentRoot?: string): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  for (const experience of getExperiences(contentRoot)) {
    const anchor = `#${experience.id}`;

    chunks.push({
      id: `${experience.id}-context`,
      text: `${experience.role} at ${experience.company}\n\n${experience.context}`,
      source: "experience",
      chapterId: experience.id,
      anchor,
    });

    chunks.push({
      id: `${experience.id}-actions`,
      text: experience.responsibilities.join("\n"),
      source: "experience",
      chapterId: experience.id,
      anchor,
    });

    experience.projects.forEach((project, index) => {
      chunks.push({
        id: `${experience.id}-project-${index}`,
        text: `${project.title}\n${project.outcome}\n${project.metrics.join("\n")}`,
        source: "experience",
        chapterId: experience.id,
        anchor: project.projectId
          ? `#${project.projectId}`
          : `#${experience.id}-projects`,
      });
    });

    chunks.push({
      id: `${experience.id}-leadership`,
      text: experience.leadership.join("\n"),
      source: "experience",
      chapterId: experience.id,
      anchor,
    });

    chunks.push({
      id: `${experience.id}-lessons`,
      text: experience.lessons,
      source: "experience",
      chapterId: experience.id,
      anchor,
    });
  }

  for (const skill of getSkills(contentRoot)) {
    chunks.push({
      id: `skill-${slugify(skill.name)}`,
      text: `${skill.name} — evidenced by ${skill.evidence.join(", ")}`,
      source: "skill",
      anchor: "#skills",
    });
  }

  for (const project of getProjects(contentRoot)) {
    chunks.push({
      id: `project-${project.id}`,
      text: [
        `${project.title} (${project.company})`,
        `Problem: ${project.problem}`,
        `Approach: ${project.approach}`,
        `Outcome: ${project.outcome}`,
        `Metrics: ${project.metrics.join("; ")}`,
      ].join("\n"),
      source: "project",
      anchor: `#${project.id}`,
    });
  }

  getFaq(contentRoot).forEach((entry, index) => {
    chunks.push({
      id: `faq-${index}`,
      text: `${entry.question}\n\n${entry.answer}`,
      source: "faq",
      anchor: "#faq",
    });
  });

  return chunks;
}
