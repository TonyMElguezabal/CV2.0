## Context

`content/projects/*.md` and `ProjectSchema` (title, company, skills, metrics frontmatter + narrative body) were already anticipated by `content-model` and `content-validation` from Stories 1.1/1.2 — `validate.ts` already optionally scans a `projects/` directory and the test fixtures already model a project file — but no real project files exist and nothing in the app reads them. `career-chapter-rendering` and `skills-evidence-section` already established the site's two precedents for "link a claim to its evidence": chapter-technology → chapter Projects-section anchor, and skill → chapter Projects-section anchor. This story adds a third, richer evidence artifact (the standalone project card) and a way for a chapter's own embedded project summary to point at it.

## Goals / Non-Goals

**Goals:**
- Two real project cards (ADEHub, AI background removal) render problem → approach → outcome → metrics, in that fixed order, sourced entirely from facts already reviewed in `oracle.yaml`/`envato.yaml`.
- A chapter's matching embedded project links to its full card.
- No JavaScript required — server-rendered, real anchor links.

**Non-Goals:**
- Not authoring a card for every embedded project — only the two flagship ones the site owner selected.
- No `skills.yaml` changes — evidence entries keep referencing chapter ids only; project-id evidence is a future concern, not this story's.
- No redesign of `CareerChapter.tsx`'s existing project rendering beyond the new conditional link.

## Decisions

- **Body sections identified by `## Problem` / `## Approach` / `## Outcome` H2 headings, not free-form prose.** The existing test fixture (`VALID_PROJECT` in `test-fixtures.ts`) used unstructured prose ("Problem. Approach. Outcome.") because nothing rendered it yet; JOS-60's AC1 requires the *rendered card* to present the three sections "in that order," which is a rendering contract most reliably satisfied by parsing named sections rather than trusting source-file prose order. This matches the site's existing pattern of explicit `<h4>` subheadings per §F3 element in `CareerChapter.tsx` — one structural convention, not a second bespoke one.
- **Rendering order is fixed by the component (Problem, then Approach, then Outcome, then Metrics), not by document order.** Parses each `## <Name>` section into a `{ problem, approach, outcome }` record and renders from that record directly — a section appearing out of order in the source file (or a typo in a heading) can't silently reorder or drop content on the page.
- **Content sourced by restructuring, not inventing.** Both cards' Problem/Approach/Outcome text is built from already-reviewed real fields: the chapter's `context` (problem), relevant `lessons` text (approach), and the project's existing `outcome`/`metrics` (outcome) — see the exact source mapping in tasks.md. Nothing here is new information; it's the same facts already shipped in `oracle.yaml`/`envato.yaml`, restructured into the narrative shape this story's rendering contract requires.
- **`projectId` is optional on `ExperienceProjectSchema`, defaulting to no link.** Only the two selected projects get one; every other embedded project across both chapters renders exactly as it does today (unlinked outcome/metrics) — no behavior change for content this story doesn't touch.
- **Chapter → card link target is `#{projectId}` on the new Projects section**, mirroring the existing `#{experienceId}-projects` and skills-evidence anchor conventions rather than inventing a fourth pattern.
- **Server component, no `"use client"`.** Same reasoning as `SkillsSection` — nothing here needs live browser state.

## Risks / Trade-offs

- [Risk] Restructuring existing chapter facts into a new narrative shape could unintentionally alter their meaning → Mitigation: source text is quoted/paraphrased minimally per the explicit mapping in tasks.md, and the PR carries a human-review gate before merge, same as all real content changes in this repo.
- [Risk] `projectId` values that don't match any real `content/projects/*.md` filename would silently produce a dead anchor link → Mitigation: both `projectId` values set in this story are verified against the actual filenames created in the same change; a future dangling-`projectId` check could be added to `content-validation` later if more projects are linked, but isn't required for two known-good values.

## Open Questions

None outstanding — project selection and linking mechanism were confirmed with the site owner before this design was written.
