## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [ ] 0.1 Create feature branch `feature/remove-grid-overlay` from `main` (pull `main` first — JOS-111 and the scroll-reveal archive have both landed)
- [ ] 0.2 Verify with `git branch --show-current`
- [ ] 0.3 Confirm the untracked `docs/PRD2.md` stays out of every commit in this change — it is pre-existing and unrelated

## 1. Remove the grid overlay (AC: no vertical hairlines and no header rule render)

- [ ] 1.1 Delete `components/GridOverlay.tsx`
- [ ] 1.2 Delete `components/GridOverlayStyles.ts`
- [ ] 1.3 Delete `components/GridOverlay.test.tsx` — all four of its tests assert properties (aria-hidden, non-focusable, `pointer-events-none`, no text nodes) of a component that no longer exists, so they are removed with it rather than rewritten
- [ ] 1.4 In `app/(marketing)/layout.tsx`, remove the `GridOverlay` import, the `<GridOverlay />` mount, and the explanatory comment block above it. Leave `HeroLaptop` and `AmbientSparkleLayer` and their comments untouched (design.md Decision 6)

## 2. Preserve the surviving scroll-indicator guardrail (design.md Decision 3)

Deliberately its own group: `oneScrollIndicator.test.tsx` looks like grid cleanup
but enforces a requirement that survives this change. Deleting it alongside the
component would silently drop that enforcement.

- [ ] 2.1 In `components/oneScrollIndicator.test.tsx`, remove the `GridOverlay` import and drop `<GridOverlay />` from the composed render in "only a CareerTimeline node can ever carry aria-current in the composed frame" — keep the test and its assertion
- [ ] 2.2 Leave "the header's own nav never carries aria-current" completely unchanged — it never referenced the grid
- [ ] 2.3 Delete only the third test, "the grid overlay renders no interactive or stateful indicator elements at all"
- [ ] 2.4 Update the file's header comment, which currently says the test asserts "the header and grid overlay are structurally incapable of producing that same signal", so it describes the header alone
- [ ] 2.5 Run `npx vitest run components/oneScrollIndicator.test.tsx` and confirm the two surviving tests pass — the requirement `The frame introduces no second scroll-position indicator` is still enforced

## 3. Confirm the deliberate non-changes hold (design.md Decisions 2, 4, 6)

- [ ] 3.1 Confirm `app/globals.css` is untouched and `--hair` still exists — verify the five remaining consumers still resolve (`CareerTimelineStyles`, `CareerChaptersStyles`, `ProjectsSectionStyles`, `HeroShellStyles`, `SiteHeaderStyles`) via `grep -rn "border-hair\|bg-hair\|decoration-hair" components/`
- [ ] 3.2 Confirm `components/palette.test.tsx` is unmodified and green — it is the tripwire for task 3.1
- [ ] 3.3 Confirm `siteHeaderClass` gained **no** `border-b` or any other replacement edge; the header keeps only `bg-background/90 backdrop-blur-sm` (design.md Decision 2 — adding a border back would reinstate the exact line this change removes)
- [ ] 3.4 Confirm `components/AmbientSparkleLayer.tsx` and its mount position are unchanged — it must still be mounted after `HeroLaptop`

## 4. Review and Update Existing Unit Tests (MANDATORY)

- [ ] 4.1 `grep -rn "GridOverlay" --include="*.ts" --include="*.tsx" .` (excluding `node_modules`) and resolve every remaining hit
- [ ] 4.2 Update the stale test title in `components/AmbientSparkleLayer.test.tsx` (~line 181), "sits behind normal content via a negative z-index, matching HeroLaptop/GridOverlay's convention" — a name-only reference with no functional coupling; the `-z-10` assertion itself stays
- [ ] 4.3 Confirm `components/accessibilityStructure.test.tsx` needs no change — it composes `SiteHeader`/`HeroLaptop`/`AmbientSparkleLayer`/`CareerTimeline`/sections/`ChatWidget` and never rendered `GridOverlay`
- [ ] 4.4 Confirm no test was weakened to pass — the only deletions are tests whose subject no longer exists (1.3, 2.3), and every assertion about a surviving component is preserved

## 5. Run Unit Tests and Verify State (MANDATORY)

- [ ] 5.1 Run targeted tests for the touched modules: `npx vitest run components/oneScrollIndicator.test.tsx components/AmbientSparkleLayer.test.tsx components/palette.test.tsx components/accessibilityStructure.test.tsx`
- [ ] 5.2 Run the full suite: `npx vitest run` (use `--no-file-parallelism` on a flake; `ChatWidget.test.tsx` has a known CPU-contention `waitFor` flake unrelated to this change)
- [ ] 5.3 Run `npx tsc --noEmit` clean — this also catches any missed import of the deleted modules
- [ ] 5.4 Run `npm run validate:content` clean (expected unaffected — no `/content` change)
- [ ] 5.5 Run `npm run lint` — pre-existing repo-wide ESLint config failure (no `eslint.config.js`); skip with the same rationale as prior stories
- [ ] 5.6 Database state verification: **N/A** — no backend or database exists in this repo (CLAUDE.md §9). Record the rationale in the Step 5 report
- [ ] 5.7 Create report `openspec/changes/remove-grid-overlay/reports/YYYY-MM-DD-step-5-unit-test-and-state-verification.md`

## 6. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [ ] 6.1 **N/A** — this change touches no route, endpoint, or API contract; it deletes a decorative client component. Record the rationale in the Step 7 report

## 7. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

This change is purely visual, so the browser is the primary verification surface,
not a supplement to the unit tests.

- [ ] 7.1 Start the dev server and drive a real browser
- [ ] 7.2 Capture a **before** screenshot (from `main`, grid still present) so the removal is demonstrable rather than asserted
- [ ] 7.3 Confirm at a desktop viewport that both vertical hairlines and the horizontal rule under the header are gone, scrolling the full document top to bottom
- [ ] 7.4 Confirm the same at a **short viewport** (`max-height: 480px`, e.g. landscape phone) — this exercises the compact-header override the removed rule carried (`top-[72px]`), the case most likely to leave an orphaned line behind
- [ ] 7.5 **Verify the header still reads as anchored without its rule** (design.md Decision 2's named risk): scroll dense content beneath the header and confirm `bg-background/90 backdrop-blur-sm` keeps it legible and visually separated. **If it genuinely reads badly, stop and report to the owner — do not add a border back**, which would reinstate the removed line from a different file
- [ ] 7.6 Confirm the rest of the frame is unaffected: header navigation, anchor clearance on a deep link, the skip link, `HeroLaptop`, `AmbientSparkleLayer`, and the scroll reveals all behave as before
- [ ] 7.7 Capture **after** screenshots at both viewports
- [ ] 7.8 Create report `openspec/changes/remove-grid-overlay/reports/YYYY-MM-DD-step-7-browser-verification.md`, including the curl N/A rationale from task 6.1

## 8. Build sanity

- [ ] 8.1 Run `npm run build` and confirm it succeeds
- [ ] 8.2 Confirm no dependency change (`git diff main --stat -- package.json package-lock.json` is empty)
- [ ] 8.3 Re-measure the Cloudflare Worker bundle with `npx wrangler deploy --dry-run` and record it — expected flat-to-slightly-down (two modules removed). Baseline: 1520.08 KiB gzip / 49.5% of the 3072 KiB free-tier limit

## 9. Update Technical Documentation (MANDATORY)

- [ ] 9.1 Update `AGENTS.md` §9's first `GridOverlay` reference (in the `SiteHeader` bullet) so the one-scroll-indicator rule reads against the header alone
- [ ] 9.2 Update `AGENTS.md` §9's second `GridOverlay` reference (in the `AmbientSparkleLayer` bullet) — restate its stacking constraint as "after `HeroLaptop` and its scrim" rather than "between `HeroLaptop` and `GridOverlay`", preserving the measured ~80% rationale
- [ ] 9.3 While in that passage, fix the now-stale path it cites — `openspec/changes/editorial-frame/specs/site-editorial-frame/spec.md` is archived and synced; it should read `openspec/specs/site-editorial-frame/spec.md`
- [ ] 9.4 Confirm `grep -rn "GridOverlay"` returns only archived OpenSpec history (`openspec/changes/archive/**`) and this change's own artifacts

## 10. OpenSpec sync

- [ ] 10.1 **After merge**, sync `specs/site-editorial-frame/spec.md` into `openspec/specs/site-editorial-frame/spec.md` — verify `Requirement: The grid overlay is decorative only` is gone, the small-viewport requirement lost only its grid clause, and the Purpose is replaced with design.md Decision 5's rewritten text
- [ ] 10.2 Confirm after sync that `Requirement: The frame introduces no second scroll-position indicator` is still present and unmodified
- [ ] 10.3 Archive this change (per CLAUDE.md §10 / `opsx:archive`)
