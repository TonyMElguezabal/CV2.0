## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/remove-grid-overlay` from `main` — pulled first, which also brought in JOS-112 (`arrival-sequence`) and JOS-107 (`narrow-performance-budget`), both merged since this change was proposed
- [x] 0.2 Verified: `git branch --show-current` → `feature/remove-grid-overlay`
- [x] 0.3 Confirmed: `docs/PRD2.md` doesn't exist on this branch at all (it was committed directly by the owner on `feature/arrival-sequence`, unrelated to this change, and never checked out here)

## 1. Remove the grid overlay (AC: no vertical hairlines and no header rule render)

- [x] 1.1 Deleted `components/GridOverlay.tsx`
- [x] 1.2 Deleted `components/GridOverlayStyles.ts`
- [x] 1.3 Deleted `components/GridOverlay.test.tsx`
- [x] 1.4 In `app/(marketing)/layout.tsx`, removed the `GridOverlay` import, the `<GridOverlay />` mount, and its explanatory comment block. Also updated the `ArrivalSequenceProvider` wrapper's own comment (added by JOS-112, merged since this change was proposed), which named `GridOverlay` as one of the components incidentally inside its boundary — no longer applicable. `HeroLaptop` and `AmbientSparkleLayer` and their comments left untouched (design.md Decision 6)

## 2. Preserve the surviving scroll-indicator guardrail (design.md Decision 3)

Deliberately its own group: `oneScrollIndicator.test.tsx` looks like grid cleanup
but enforces a requirement that survives this change. Deleting it alongside the
component would silently drop that enforcement.

- [x] 2.1 Removed the `GridOverlay` import and dropped `<GridOverlay />` from the composed render in "only a CareerTimeline node can ever carry aria-current in the composed frame" — test and its assertion kept
- [x] 2.2 "the header's own nav never carries aria-current" left completely unchanged
- [x] 2.3 Deleted the third test, "the grid overlay renders no interactive or stateful indicator elements at all"
- [x] 2.4 Updated the file's header comment to describe the header alone, not "the header and grid overlay"
- [x] 2.5 `npx vitest run components/oneScrollIndicator.test.tsx` — 2/2 pass, `The frame introduces no second scroll-position indicator` still enforced

## 3. Confirm the deliberate non-changes hold (design.md Decisions 2, 4, 6)

- [x] 3.1 Confirmed `app/globals.css` is untouched and `--hair` still exists — now **six** consumers resolve (`CareerTimelineStyles`, `CareerChaptersStyles`, `ContactSectionStyles`, `HeroShellStyles`, `ProjectsSectionStyles`, `SiteHeaderStyles`, `SkillsSectionStyles` — two more than at proposal time, added by work merged since)
- [x] 3.2 Confirmed `components/palette.test.tsx` is unmodified (`git diff` empty) and green (12/12)
- [x] 3.3 Confirmed `siteHeaderClass` gained no `border-b` or any replacement edge — still only `bg-background/90 backdrop-blur-sm`. **Bonus fix**: the comment directly above it still described the grid overlay drawing the header's rule (a component that no longer exists as of task 1) — updated to state the header is deliberately edgeless now
- [x] 3.4 Confirmed `components/AmbientSparkleLayer.tsx` is untouched (`git diff` empty) and its mount position in `layout.tsx` (after `HeroLaptop`) is unaffected — `GridOverlay` was removed from *after* it, not from between them

## 4. Review and Update Existing Unit Tests (MANDATORY)

- [x] 4.1 `grep -rln "GridOverlay"` found two remaining hits: `components/ArrivalSequenceProvider.test.tsx` (a comment correctly describing this exact removal — "as GridOverlay's removal, JOS-113, now permanently does for the grid" — factually accurate, not stale, left as is) and `components/AmbientSparkleLayer.test.tsx` (the stale test title, fixed below)
- [x] 4.2 Updated the test title in `components/AmbientSparkleLayer.test.tsx` — "matching HeroLaptop/GridOverlay's convention" → "matching HeroLaptop's convention"; the `-z-10` assertion itself unchanged
- [x] 4.3 Confirmed `components/accessibilityStructure.test.tsx` needs no change — `grep` for `GridOverlay` returns nothing; it never rendered the component
- [x] 4.4 Confirmed no test was weakened to pass — the only deletions are tests whose subject no longer exists (task 1.3's whole file, task 2.3's one test), and every assertion about a surviving component (header, `oneScrollIndicator`, `AmbientSparkleLayer`'s z-index) is preserved unchanged

## 5. Run Unit Tests and Verify State (MANDATORY)

- [x] 5.1 Ran targeted tests for the 4 touched modules — 44/44 pass
- [x] 5.2 Ran the full suite: `npx vitest run --no-file-parallelism` — two runs showed one flaky failure in the untouched `ChatWidget.test.tsx` (same pre-existing CPU-contention timing documented throughout this session); a clean third run passed 532/532
- [x] 5.3 `npx tsc --noEmit` — clean
- [x] 5.4 `npm run validate:content` — clean
- [x] 5.5 `npm run lint` — pre-existing repo-wide ESLint config failure, same rationale as prior stories
- [x] 5.6 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9)
- [x] 5.7 Report created: `openspec/changes/remove-grid-overlay/reports/2026-08-15-step-5-unit-test-and-state-verification.md`

## 6. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 6.1 **N/A** — this change touches no route, endpoint, or API contract; it deletes a decorative client component. Rationale recorded here and echoed in the Step 7 report

## 7. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

This change is purely visual, so the browser is the primary verification surface,
not a supplement to the unit tests.

- [x] 7.1 Started the dev server and drove a real browser via Claude in Chrome
- [x] 7.2 A temporary `main` worktree for a true side-by-side "before" server hit a Turbopack limitation (rejects a `node_modules` symlink pointing outside the worktree); used this session's own earlier grid-present screenshots (from arrival-sequence's Step 10 verification, taken before this change) as the "before" reference instead
- [x] 7.3 Confirmed at desktop viewport, scrolling the full document — no vertical hairlines and no header rule anywhere
- [x] 7.4 The `resize_window` tool did not actually change the rendered viewport in this session (tooling limitation, documented in the Step 7 report) — verified the underlying guarantee structurally instead: `grep` for the removed classes returns nothing anywhere, and the whole file carrying the compact-header override was deleted outright, not conditionally hidden, so no CSS rule exists at any viewport height to leave an orphaned line
- [x] 7.5 Verified the header reads as anchored without its rule: scrolled dense chapter text beneath it and zoomed in — brand/nav/Contact stayed crisply legible against the blurred/dimmed content behind. No stop-and-report needed; it reads well
- [x] 7.6 Confirmed the rest of the frame is unaffected: clicked the "Skills" header nav link, confirmed the active-state style switch, confirmed anchor clearance (heading fully visible below the header), and caught the Skills heading mid scroll-reveal cross-fade in the same capture, confirming JOS-111 is unaffected
- [x] 7.7 Screenshot captured and saved to disk (path in the Step 7 report)
- [x] 7.8 Report created: `openspec/changes/remove-grid-overlay/reports/2026-08-15-step-7-browser-verification.md`, including the curl N/A rationale from task 6.1

## 8. Build sanity

- [x] 8.1 `npm run build` succeeds — Turbopack compiled, TypeScript clean, all 10 routes generated
- [x] 8.2 Confirmed no dependency change: `git diff main --stat -- package.json package-lock.json` is empty
- [x] 8.3 Re-measured via `npx wrangler deploy --dry-run`: **1521.75 KiB gzip** (49.54% of the 3072 KiB free-tier limit, 1550.25 KiB headroom) — essentially flat against the pre-change baseline recorded during `arrival-sequence` (1521.81 KiB, JOS-112), a **-0.06 KiB** decrease from removing two client modules. Confirms the expected "flat-to-slightly-down" outcome; note the original proposal's baseline (1520.08 KiB, JOS-107) predates JOS-112's own small increase — this measurement is against the accurate immediately-prior state, not the stale proposal-time number

## 9. Update Technical Documentation (MANDATORY)

- [x] 9.1 Updated `AGENTS.md` §9's `SiteHeader` bullet — the one-scroll-indicator rule now reads against the header alone, and a new sentence records the grid's removal (JOS-113) and the header's deliberately edgeless state
- [x] 9.2 Updated `AGENTS.md` §9's `AmbientSparkleLayer` bullet — "mounted... between `HeroLaptop` and `GridOverlay`" → "mounted... after `HeroLaptop`"; the measured ~80% rationale sentence immediately after was untouched
- [x] 9.3 Fixed the same passage's stale path while there: `openspec/changes/editorial-frame/specs/site-editorial-frame/spec.md` (archived) → `openspec/specs/site-editorial-frame/spec.md` (synced), and switched the citation to name the actual requirement rather than the amended-requirement framing left over from before editorial-frame's own archive/sync
- [x] 9.4 Confirmed: `grep -rln "GridOverlay"` (excluding `openspec/changes/archive/**` and this change's own artifacts) returns `AGENTS.md` (this ticket's own accurate updates), `ArrivalSequenceProvider.test.tsx` (a comment correctly describing this exact removal, confirmed not stale in task 4.1), and `ambient-sparkle-layer/tasks.md`/its Step 7 report (JOS-110's own completed, historical task notes, accurately describing state at the time they were written — left untouched, matching this session's precedent of not retroactively editing prior tickets' history)

## 10. OpenSpec sync

- [x] 10.1 **After merge**, sync `specs/site-editorial-frame/spec.md` into `openspec/specs/site-editorial-frame/spec.md` — verify `Requirement: The grid overlay is decorative only` is gone, the small-viewport requirement lost only its grid clause, and the Purpose is replaced with design.md Decision 5's rewritten text
- [x] 10.2 Confirm after sync that `Requirement: The frame introduces no second scroll-position indicator` is still present and unmodified
- [x] 10.3 Archive this change (per CLAUDE.md §10 / `opsx:archive`)
