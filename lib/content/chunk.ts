import { getExperiences, getProfile, getSkills, getProjects, getFaq, getMeta } from "./read.ts";

export interface ContentChunk {
  id: string;
  text: string;
  source: "experience" | "project" | "skill" | "faq" | "profile" | "meta";
  chapterId?: string;
  anchor: string;
}

// Required, not optional: a caller cannot silently produce chunks (in
// particular the site-meta chunks, which name the active model) without
// naming the model actually configured in code. See design.md in
// openspec/changes/chatbot-corpus-coverage.
export interface ContentChunkModels {
  llm: string;
  embedding: string;
}

export interface GetContentChunksOptions {
  contentRoot?: string;
  models: ContentChunkModels;
}

// A chunk shorter than this carries a bare label or identifier list rather
// than retrievable meaning. Never used to filter or merge chunks — a chunk
// below this length means the underlying content is thin and should be
// authored, not hidden (design decision 5). See design.md in
// openspec/changes/chatbot-corpus-coverage. Measured against a chunk's
// *authored* content, excluding chapterFramingPrefix()'s generated
// role/company/date prefix — that framing would otherwise mask thin
// authored content by padding the combined text past this threshold (see
// design.md in openspec/changes/chatbot-era-collision-guard).
export const MIN_CHUNK_LENGTH = 60;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Renders a YYYY-MM or YYYY-MM-DD date string as "Month YYYY" — embeddings
// match natural phrasing ("March 2019") better than raw ISO values, but the
// raw values are also carried in the chunk text since eval expectedSubstrings
// are most stable against them (design decision 7).
function renderMonthYear(dateString: string): string {
  const [year, month] = dateString.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1] ?? month;
  return `${monthName} ${year}`;
}

function renderDateRange(start: string, end: string | undefined): string {
  const startRendered = renderMonthYear(start);
  const endRendered = end ? renderMonthYear(end) : "present";
  return `${startRendered} – ${endRendered}`;
}

interface FramableExperience {
  role: string;
  company: string;
  dates: { start: string; end?: string };
}

// Prefixed onto otherwise-unattributed chunk bodies (technologies, actions,
// leadership, lessons) so a chunk retrieved in isolation still carries the
// era and employer it describes — without this, a chunk naming legacy
// tooling competes on equal footing with one naming current tooling for a
// question explicitly about present-day capability. Reuses
// renderDateRange() so the date form matches the chapter's mission-dates
// chunk (chatbot-era-collision-guard design.md Decision 1). Exported so
// tests can measure a chunk's authored body separately from this generated
// framing (design.md Decision 4) — MIN_CHUNK_LENGTH must flag thin authored
// content even when the framing alone would push a chunk over the
// threshold.
export function chapterFramingPrefix(experience: FramableExperience): string {
  const dateRange = renderDateRange(experience.dates.start, experience.dates.end);
  return `${experience.role} at ${experience.company} (${dateRange})`;
}

// Chunks by semantic unit (chapter section, project, leadership story, FAQ
// pair), per PRD §7 — each chunk carries source/chapter/anchor metadata so
// retrieved answers can cite and deep-link into the site. See design.md in
// openspec/changes/llm-retrieval-spike.
export function getContentChunks(options: GetContentChunksOptions): ContentChunk[] {
  const { contentRoot } = options;
  const chunks: ContentChunk[] = [];

  const profile = getProfile(contentRoot);
  chunks.push({
    id: "profile-summary",
    text: `${profile.positioning}\n\n${profile.summary}`,
    source: "profile",
    anchor: "#main",
  });

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
      id: `${experience.id}-mission-dates`,
      text: [
        `${experience.role} at ${experience.company}`,
        experience.mission,
        `Dates: ${experience.dates.start} to ${experience.dates.end ?? "present"}`,
        `(${renderDateRange(experience.dates.start, experience.dates.end)})`,
      ].join("\n"),
      source: "experience",
      chapterId: experience.id,
      anchor,
    });

    chunks.push({
      id: `${experience.id}-actions`,
      text: `${chapterFramingPrefix(experience)}\n${experience.responsibilities.join("\n")}`,
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

    if (experience.technologies.length > 0) {
      chunks.push({
        id: `${experience.id}-technologies`,
        text: `${chapterFramingPrefix(experience)}\nJose worked with the following tools and technologies: ${experience.technologies.join(", ")}.`,
        source: "experience",
        chapterId: experience.id,
        anchor,
      });
    }

    chunks.push({
      id: `${experience.id}-leadership`,
      text: `${chapterFramingPrefix(experience)}\n${experience.leadership.join("\n")}`,
      source: "experience",
      chapterId: experience.id,
      anchor,
    });

    chunks.push({
      id: `${experience.id}-lessons`,
      text: `${chapterFramingPrefix(experience)}\n${experience.lessons}`,
      source: "experience",
      chapterId: experience.id,
      anchor,
    });
  }

  for (const skill of getSkills(contentRoot)) {
    chunks.push({
      id: `skill-${slugify(skill.name)}`,
      text: `${skill.name}\n${skill.summary}\nEvidenced by: ${skill.evidence.join(", ")}`,
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

  // Site-meta chunks: a few dense, semantically distinct chunks (not one
  // per paragraph) so they compete fairly for retrieval slots against the
  // rest of the corpus at a fixed k=5 (design decision 4). Anchored at
  // #chat — the real, existing element these chunks describe (design
  // decision 8).
  const meta = getMeta(contentRoot);
  for (const [heading, content] of Object.entries(meta.sections)) {
    chunks.push({
      id: `meta-${slugify(heading)}`,
      text: `${meta.title}\n\n${content}`,
      source: "meta",
      anchor: "#chat",
    });
  }
  chunks.push({
    id: "meta-model-stack",
    text: `${meta.title} — this chatbot generates answers using the ${options.models.llm} language model, over content retrieved with the ${options.models.embedding} embedding model.`,
    source: "meta",
    anchor: "#chat",
  });

  return chunks;
}
