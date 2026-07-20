## Why

JOS-60 (PRD §5 F4 bullet 2; §6) requires each project presented as problem → approach → outcome → metrics, so a recruiter understands the impact behind a claim quickly. `content/projects/*.md` and `ProjectSchema` are already anticipated by the content model and build-time validator (from 1.1/1.2), but no project files exist yet and nothing reads or renders them. Per the site owner's direction, this story authors standalone cards for two flagship projects — Oracle's ADEHub and Envato's AI-powered background removal tool — rather than one per chapter project, and links each chapter's matching embedded project entry to its card via a new optional `projectId` field.

## What Changes

- Author `content/projects/adehub.md` and `content/projects/ai-background-removal.md`: frontmatter (title, company, skills, metrics) plus a `## Problem` / `## Approach` / `## Outcome` narrative body, built entirely from facts already established and reviewed in `oracle.yaml`/`envato.yaml` (chapter `context`, project `outcome`/`metrics`, and `lessons`) — no new claims invented.
- Add `getProjects()` to `lib/content/read.ts`, parsing frontmatter via `ProjectSchema` and splitting the body into its three named sections.
- Add a `ProjectsSection` component rendering each project's title/company/skills tags, then Problem, Approach, Outcome, then metrics — always in that fixed order regardless of section order in the source file.
- Add optional `projectId` to `ExperienceProjectSchema`; set it on `oracle.yaml`'s ADEHub project entry (`adehub`) and `envato.yaml`'s AI background-removal entry (`ai-background-removal`).
- `CareerChapter.tsx`: when a chapter's embedded project has a `projectId`, render a "View full project" link to that card's anchor on the new Projects section; projects without a `projectId` render exactly as they do today (unlinked outcome/metrics).
- Mount `ProjectsSection` in `app/page.tsx` after `SkillsSection`, matching PRD §5 F4's bullet order (skills, then project cards).

## Capabilities

### New Capabilities
- `project-cards`: real project content sourcing (`content/projects/*.md`, no placeholders) and the problem→approach→outcome→metrics rendering contract.

### Modified Capabilities
- `content-model`: `ExperienceProjectSchema` gains an optional `projectId` field.
- `career-chapter-rendering`: a chapter's embedded project renders a link to its full project card when a `projectId` is present.

## Impact

- New: `content/projects/adehub.md`, `content/projects/ai-background-removal.md`
- `lib/content/schemas.ts`: `ExperienceProjectSchema` gains optional `projectId`
- `lib/content/read.ts`: new `getProjects()`
- `content/experience/oracle.yaml`, `content/experience/envato.yaml`: add `projectId` to the two matching project entries
- New: `components/ProjectsSection.tsx`, `components/ProjectsSectionStyles.ts`, plus tests
- `components/CareerChapter.tsx`: conditional "View full project" link
- `app/page.tsx`: mounts `ProjectsSection`
- No changes to `skills.yaml` — out of scope; evidence entries continue referencing chapter ids only
