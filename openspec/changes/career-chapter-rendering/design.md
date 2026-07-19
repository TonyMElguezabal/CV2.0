## Context

`content/experience/oracle.yaml` has held real, schema-validated chapter data since Story 1.3a (`ExperienceSchema`: `company`, `role`, `mission`, `dates.start`/`dates.end`, `context`, `responsibilities[]`, `projects[]` of `{title, outcome, metrics[]}`, `leadership[]`, `technologies[]`, `lessons`). Nothing renders it yet — `app/page.tsx` only renders `HeroFramer`. `lib/content/read.ts` exposes `getProfile()` only; there is no reader for experience chapters. Story 3.1 (the timeline meant to be this section's navigation entry point) has not been built yet — it's a separate, not-yet-started Sprint 2 story.

## Goals / Non-Goals

**Goals:**
- Read every real chapter under `content/experience/` and render each as a progressively-disclosed section: collapsed summary by default, all seven §F3 elements in order when expanded.
- Keyboard-operable expand/collapse with visible focus, using the simplest mechanism that gets this for free rather than hand-rolled ARIA state management.
- Scale automatically from today's one chapter to however many `getExperiences()` returns later — no hardcoding to "oracle."

**Non-Goals:**
- Story 3.1's interactive timeline navigation — not built here.
- Story 3.3b's technology-to-evidence linking — technologies render as plain text in this story.
- Story 3.3c's no-JS-readability verification — not this story's AC, though the mechanism chosen here (see Decision 3) substantially de-risks that follow-up story.

## Decisions

**1. Interim page placement: a new section directly below the hero's `#hero-next` spacer, not a fabricated timeline integration.**
Since 3.1 doesn't exist yet, this story renders the chapter list as its own real page section in `app/page.tsx`, positioned right after `HeroFramer`'s spacer. This is a known interim state — once 3.1 ships, it becomes the navigation entry point that scrolls/links into this section, and this placement may be revisited then. Documented here so it isn't silently treated as permanent.
*Alternative considered*: building a placeholder timeline stub now. Rejected — fabricating navigation UI for a feature explicitly out of scope adds unrequested surface area and risks conflicting with 3.1's actual design once that story starts.

**2. Collapsed-summary content: role, company, mission, and a formatted date range.**
`mission` was added to `ExperienceSchema` in Story 1.3a specifically to serve as this one-line summary. The collapsed `<summary>` renders `{role} at {company}` as the heading, `{mission}` beneath it, and a formatted date range (`dates.start`–`dates.end`, or `dates.start`–`Present` when `end` is absent) — all real fields, no new content authoring required.

**3. Expand/collapse mechanism: native `<details>`/`<summary>`, not a custom button + conditional render.**
This gets keyboard operability (Enter/Space toggles a focused `<summary>`) and a visible focus outline for free, from browser-native semantics — no manual `aria-expanded`/`aria-controls`/focus-trap logic to get subtly wrong. It also means the expand/collapse interaction requires **zero JavaScript** to function at all, which substantially de-risks Story 3.3c (no-JS chapter readability) before that story even starts — worth noting for that story's own design, not claiming it as this story's AC.
*Alternative considered*: a custom `<button aria-expanded>` + conditionally-rendered body, matching a more "component-library" pattern. Rejected — for this project's scope (informational disclosure, not a complex interactive widget), `<details>` is the more robust, lower-risk choice, and this repo's own track record (JOS-53, JOS-54) shows hand-rolled interaction state is where real bugs have come from.

**4. `getExperiences()` returns an array, chapters render via `.map()` — never indexed or hardcoded to a specific chapter.**
Mirrors `validate.ts`'s existing `readdirSync` + `basename(filename, extname(filename))` pattern for deriving each chapter's `id`. Returns chapters sorted by `dates.start` descending (most recent first) — a reasonable default for a career story, revisit if a different order is wanted once more chapters exist.

## Risks / Trade-offs

- [`<details>`'s default browser styling is minimal/inconsistent across browsers] → Mitigation: style via Tailwind classes on `<details>`/`<summary>` directly (same shared-constants pattern as `HeroShellStyles.ts`), not relying on default UA styles.
- [This story's page placement is explicitly interim] → Mitigation: documented in Decision 1; revisit once 3.1 lands.
- [Only one real chapter exists today, so multi-chapter rendering is unverified against real data until JOS-79 ships a second chapter] → Mitigation: build and test against a second, synthetic fixture chapter in the test suite (not real content) to prove the `.map()` iteration and sort order work correctly before real data catches up.
- [jsdom does not implement the browser's native accessibility-tree exclusion of closed `<details>` content, so `getByRole` queries in component tests cannot prove content is actually hidden while collapsed] → Mitigation: rely on the `HTMLDetailsElement.open === false` property assertion (which jsdom does model correctly) as the unit-test-level proof of "collapsed by default," and verify real visual collapse/expand behavior against actual Chrome rendering in the mandatory browser verification step — documented as an intentional test-tooling trade-off, not a gap in product behavior.

## Migration Plan

Not applicable — additive UI change, no data migration.

## Open Questions

None outstanding — the interim-placement and mechanism decisions above were the two real ambiguities, both resolved here rather than left implicit.
