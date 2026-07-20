## Why

JOS-59 (PRD §5 F4 bullets 1, 3) requires every listed skill to link to the projects/chapters that demonstrate it, so a recruiter can verify claims instead of trusting buzzwords. `content/skills.yaml` and its schema/build-time validation already exist (from 1.1/1.2), but nothing in the app reads or renders it — no `getSkills()`, no Skills component, and it isn't reachable from the page at all. Separately, `content/projects/*.md` (the other evidence target the content model anticipates) doesn't exist yet — authoring those is JOS-60's separate scope — so every current `skills.yaml` evidence entry points at an experience chapter, not a project.

## What Changes

- Add `getSkills()` to `lib/content/read.ts`, reading and parsing `content/skills.yaml` through `SkillSchema`.
- Add a `SkillsSection` component rendering every skill with links to the chapter(s) in its evidence list — reusing the same `#{id}-projects` anchor convention `career-chapter-rendering` already established for chapter-technology links, since projects aren't independently addressable content yet.
- Mount `SkillsSection` in `app/page.tsx` after `CareerChapters`, matching PRD §5's F1→F2→F3→F4 ordering.
- Tighten `SkillSchema.evidence` to require at least one entry (`z.array(z.string()).min(1)`). This closes a real gap: `content-model`'s existing spec already describes evidence as "one or more IDs," but nothing enforces non-empty today — an empty-evidence skill currently passes validation, silently violating PRD §4.4 ("no unlinked skill claims").

## Capabilities

### New Capabilities
- `skills-evidence-section`: the Skills section's content sourcing (real `skills.yaml` data, no placeholders), per-skill evidence-link rendering, and accessible-out-of-context link naming.

### Modified Capabilities
- `content-validation`: the "Skill" schema check gains the ability to reject an empty `evidence` array (currently only dangling *references* are detected; a technically-non-dangling but empty array passes today).

## Impact

- `lib/content/schemas.ts`: `SkillSchema.evidence` gains `.min(1)`
- `lib/content/read.ts`: new `getSkills()` export
- New: `components/SkillsSection.tsx`, `components/SkillsSectionStyles.ts`, plus tests
- `app/page.tsx`: mounts `SkillsSection`
- No changes to `content/projects/*` or `ProjectSchema` — out of scope (JOS-60)
