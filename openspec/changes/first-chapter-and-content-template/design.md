## Context

Story 1.1 shipped `/content` with fictional placeholder data (`acme-corp`, `dashboard-revamp`) used both as example fixtures *and* as the literal input Story 1.1's own test suite (`content.test.ts`) reads from the real `/content` directory. Story 1.2 added general-purpose validation but didn't change that coupling. Real content authoring starts now: the site owner provided real, approved content for their most recent role (Oracle Corp, Nov 2021–Jan 2026, Senior Software Development Manager) via a resume PDF cross-check plus detailed notes, already structured and approved in conversation prior to this change.

## Goals / Non-Goals

**Goals:**
- Ship one real, complete career chapter (`content/experience/oracle.yaml`) satisfying all seven §F3 elements.
- Retire the fictional placeholders from the real `/content` directory entirely — nothing fake should risk being rendered on the live site.
- Decouple Story 1.1's test suite from depending on specific real content, so future content changes (1.3b, 1.3c, edits) never require touching test code again.
- Define a concrete, reusable template mechanism for 1.3b/1.3c to follow without re-deriving the Experience shape.

**Non-Goals:**
- Standalone `content/projects/*.md` narrative files for the Oracle projects (Evidence Layer epic, Stories 4.1/4.2).
- Real numeric metrics for the Oracle chapter's projects (tracked as a separate follow-up issue, blocked on the site owner).
- Authoring 1.3b's or 1.3c's chapters.

## Decisions

### 1. The template is a documentation guide with an embedded YAML snippet, not a standalone content file
`docs/content-authoring-guide.md`: explains the seven §F3 elements and why they matter (progressive disclosure, evidence-over-buzzwords), followed by a fenced-YAML template with every field present and inline placeholder comments (e.g., `role: # e.g., "Senior Software Development Manager"`), plus a pointer to `content/experience/oracle.yaml` as the real worked example. `README.md`'s existing content-model section gets one linking sentence.
**Alternative considered**: a literal blank/annotated `.yaml` file inside `content/experience/`. Rejected — `validateContent()` (Story 1.2) scans every file under that directory; a template file would either fail validation (breaking the build gate) or, worse, pass with placeholder strings that happen to satisfy the schema, silently polluting the real content set with a fake chapter. Keeping the template as prose in a `.md` file outside the scanned directories makes this collision structurally impossible rather than something to remember to avoid.

### 2. Retire fictional fixtures completely from `/content`
Delete `content/experience/acme-corp.yaml` and `content/projects/dashboard-revamp.md`. Update `content/skills.yaml` to reference only the real `oracle` slug. `/content` becomes exclusively real data from this change forward.
**Alternative considered**: keep the placeholders alongside real content. Rejected (per explicit site-owner decision) — risks fictional content rendering next to real career history once a site exists.

### 3. Decouple `content.test.ts` from real content via a shared temp-fixture helper
Extract a shared helper module, `lib/content/test-fixtures.ts` (not a `.test.ts` file, so Vitest's `lib/**/*.test.ts` include pattern never treats it as a suite), exporting `makeFixtureRoot()` plus neutral `VALID_PROFILE`/`VALID_EXPERIENCE`/`VALID_PROJECT`/`VALID_SKILLS` constants. Both `content.test.ts` and `validate.test.ts` (Story 1.2, which already has its own private copy of this exact pattern) import from it. `content.test.ts`'s assertions become generic shape checks (field presence and type) rather than asserting on placeholder-specific values like "acme-corp" — so they remain valid regardless of what real content exists.
**Alternative considered**: give `content.test.ts` its own separate fixture constants. Rejected — two near-identical fixture-builders is exactly the repeated-pattern CLAUDE.md's base standards call out; one shared source of truth is less to keep in sync as the schema evolves.

### 4. `oracle.yaml` is the real content, transcribed and condensed from approved source material
Role, dates (`2021-11`–`2026-01`), business context, 6 responsibilities (condensed from the site owner's more granular notes into non-overlapping, action-oriented items), 4 projects with qualitative outcomes (no numeric metrics available — see the separate follow-up issue), one leadership story (condensed from a longer STAR narrative into one cohesive paragraph, matching the single-string `lessons`/leadership-entry pattern already established by the schema), technologies, and a two-sentence lessons-learned reflection. Content itself was drafted and approved by the site owner in conversation before this change — this story transcribes it into the schema shape verbatim, it does not re-derive or edit the substance.

## Risks / Trade-offs

- **[Risk]** Refactoring `content.test.ts` and extracting shared fixtures from `validate.test.ts` touches test files owned by two already-merged stories (1.1, 1.2). → **Mitigation**: purely a test-infrastructure change — no production code in `validate.ts`/`schemas.ts`/`types.ts` changes; both suites must keep passing as the regression gate.
- **[Risk]** Condensing the site owner's detailed source notes into schema-shaped fields (especially the 10-bullet responsibilities list → 6 items, and the long-form leadership narrative → one paragraph) could lose nuance. → **Mitigation**: the condensed version was drafted and explicitly approved by the site owner before this change; this story transcribes that approved version rather than re-summarizing.
- **[Risk]** Qualitative-only project metrics (no hard numbers) fall short of PRD §4.4's full "evidence over buzzwords" bar. → **Mitigation**: explicitly flagged to and accepted by the site owner; tracked as a separate, non-blocking follow-up issue rather than silently shipping fabricated numbers.

## Migration Plan

Additive plus one deletion: remove the two fictional fixture files and update `skills.yaml` in the same change that adds real content, so `/content` is never left in a partially-fictional state. No rollback beyond standard git revert — nothing downstream consumes this content yet (no rendering pipeline exists).

## Implementation Notes (post-hoc)

The mandatory "verify docs still match implementation" step (tasks.md §11.2) surfaced a real, pre-existing gap rather than confirming a rubber-stamp: PRD §F3 item 1 requires "Company, role, dates, one-line mission of the role," but `ExperienceSchema` (Story 1.1, refined in Story 1.2) only defined `role` and `dates` — no `company` field (company was only ever implicit via the filename slug) and no `mission` field at all.

Fixed within this change rather than deferred, since leaving it would make §11.2's confirmation false: added `company: z.string()` and `mission: z.string()` to `ExperienceSchema`. This is a schema addition (not a breaking change to existing fields), touching Story 1.1/1.2 code again — consistent with the precedent both prior changes already set for mechanical, regression-gated cross-story touches. `oracle.yaml`, `docs/content-authoring-guide.md`'s template, and the shared test fixtures (`test-fixtures.ts`, `content.test.ts`) were all updated to match. The new "mission" one-liner is new characterizing text about the site owner's real role (not dictated verbatim in their original source material), so it was drafted and explicitly confirmed with them before being added — not silently authored. Full regression confirmed clean after the fix.

No other divergence from the decisions above — the template mechanism, fixture retirement, and shared-fixture extraction all landed as designed.

## Open Questions

None carried forward — the template mechanism, fixture retirement, and content shape are all resolved by the decisions above.
