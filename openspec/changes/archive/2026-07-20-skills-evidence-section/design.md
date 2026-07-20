## Context

`content/skills.yaml`, `SkillSchema`, and build-time dangling-reference validation already exist from Stories 1.1/1.2, but nothing reads or renders the file — there is no `getSkills()`, no Skills component, and it's absent from `app/page.tsx`. `career-chapter-rendering` already solved the closely related problem of "link a claim to its evidence" for chapter technologies (JOS-83: tech name → `#{id}-projects` anchor), and `career-timeline-navigation` established the precedent of a server component driven purely by real content data with no client JS. Both are direct precedents for this story.

## Goals / Non-Goals

**Goals:**
- Every skill in `skills.yaml` renders with links to the chapter(s) that evidence it.
- Evidence links reuse the same anchor convention already established for chapter-technology links, so behavior is consistent site-wide, not a second bespoke pattern.
- An empty-evidence skill fails the content-validation build gate, matching PRD §4.4's "no unlinked skill claims."
- No JavaScript required — real anchor links, server-rendered.

**Non-Goals:**
- No `content/projects/*.md` authoring or `ProjectSchema` reader — that's JOS-60. Every current evidence entry resolves to an experience chapter; project-slug resolution will work automatically once JOS-60 adds project files and their ids appear in `knownSlugs` (already computed generically in `validate.ts`), but nothing here special-cases it.
- No visual redesign of chapters or the timeline.

## Decisions

- **Link target: `#{experienceId}-projects`, not a bare chapter anchor.** `career-chapter-rendering`'s existing "Chapter technologies link to evidence" requirement already established this exact pattern for the same underlying question ("where does a claim about a chapter link to, given individual projects aren't independently addressable"). Reusing it means one mental model site-wide instead of two.
- **One skill can list multiple evidence chapters; render one link per evidence id, not a single combined link.** `skills.yaml` entries like "Technical Program Leadership" already list `[oracle, envato]` — collapsing that into one link would lose information about which chapter demonstrates it.
- **Visible link label is the chapter's company name; accessible name includes the skill name too.** Mirrors the `career-timeline-navigation` pattern (visible label abbreviated, `aria-label` carries full context) and the `career-chapter-rendering` tech-link pattern (accessible name conveys destination, not just the bare label) — both already-reviewed precedents for "accessible out of context."
- **`getSkills()` needs `getExperiences()`'s data too, to turn an evidence id into a company/role label** — not a new coupling: `CareerTimeline` already establishes that cross-referencing experience ids from a sibling concern is the normal pattern in this codebase (JOS-56/57 already do this via `document.getElementById(experience.id)`; here it's a plain data join at render time instead, since no DOM/client-JS boundary is involved).
- **Server component, no `"use client"`.** Unlike `CareerTimeline` (which needed client JS specifically for scroll tracking), nothing here requires it — same reasoning `career-timeline-navigation`'s original (pre-JOS-57) design used.
- **Tighten `SkillSchema.evidence` to `.min(1)` rather than adding a separate "is evidence array empty" check in `validate.ts`.** The schema *is* the single source of truth for shape (per `content-model`'s "Skills evidence references" requirement, which already says "one or more IDs"); the existing `SkillSchema.safeParse` call in `validate.ts` will surface the new Zod issue through the exact same `zodIssuesToErrors` path already used for every other schema violation — no new validator code needed, just the schema constraint it was already supposed to have.

## Risks / Trade-offs

- [Risk] Tightening `SkillSchema.evidence` is a breaking schema change for any future skill authored with `evidence: []` → Mitigation: this is the intended, spec-described behavior (`content-model` already says "one or more IDs"); the existing real `skills.yaml` already satisfies it (verified: all 6 current entries have ≥1 evidence id), so this closes a gap rather than breaking working content.
- [Risk] If a future skill's evidence references a project id once JOS-60 ships, this story's `getSkills()`/`SkillsSection` need to resolve labels for project ids too, not just experience ids → Mitigation: out of scope now (no project files exist), but noted here so JOS-60 doesn't have to independently rediscover this coupling.

## Open Questions

None outstanding.
