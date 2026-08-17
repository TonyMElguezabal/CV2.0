## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create `feature/remove-hero-spacer-section` from `main`, pulling first
- [x] 0.2 Verify: `git branch --show-current` → `feature/remove-hero-spacer-section`

## 1. Remove the spacer section and retarget the CTA (AC: no empty "More below" screen, CTA still scrolls to real content)

- [x] 1.1 In `components/HeroFramer.tsx`, delete the `<div id="hero-next" className={spacerSectionClass}>More below</div>` element and drop the now-unused `spacerSectionClass` import
- [x] 1.2 In `components/HeroShellStyles.ts`, delete the now-unused `spacerSectionClass` export (confirm via `grep -rln "spacerSectionClass"` that `HeroFramer.tsx` was its only consumer)
- [x] 1.3 In `components/HeroCtas.tsx`, change the primary CTA's `href` from `#hero-next` to `#career`

## 2. Review and Update Existing Unit Tests (MANDATORY)

- [x] 2.1 Update `components/HeroCtas.test.tsx`'s "wires the primary CTA to the #hero-next in-page anchor" test — rename it and its assertion to target `#career`
- [x] 2.2 `grep -rln "hero-next"` across `components/` and confirm no other live (non-archived) file references it
- [x] 2.3 Confirm no test asserts on the removed spacer element's presence, text ("More below"), or `spacerSectionClass`

## 3. Run Unit Tests and Verify State (MANDATORY)

- [x] 3.1 Run targeted tests: `npx vitest run components/HeroCtas.test.tsx components/HeroFramer.test.tsx` (if the latter exists) — confirm pass
- [x] 3.2 Run the full suite: `npx vitest run --no-file-parallelism` — confirm no regressions
- [x] 3.3 `npx tsc --noEmit` — confirm clean
- [x] 3.4 `npm run validate:content` — confirm clean
- [x] 3.5 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9)
- [x] 3.6 Create report `openspec/changes/remove-hero-spacer-section/reports/<date>-step-3-unit-test-and-state-verification.md`

## 4. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 4.1 **N/A** — this change touches no route, endpoint, or API contract; it removes a decorative placeholder element and repoints an in-page anchor. Rationale recorded here and echoed in the Step 5 report

## 5. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [x] 5.1 Start the dev server and drive a real browser via Claude in Chrome
- [x] 5.2 Load the landing page, confirm the hero is followed immediately by real content (career timeline/chapters) with no intervening empty full-screen section or "More below" text
- [x] 5.3 Activate the "Scroll to explore ↓" CTA and confirm the page scrolls to the `#career` section, landing below the fixed header (clearance intact) rather than on an empty screen
- [x] 5.4 Confirm the header's own "Career" nav link still scrolls to the same `#career` target with unchanged behavior
- [x] 5.5 Screenshot captured and saved to disk (path in the Step 5 report)
- [x] 5.6 Create report `openspec/changes/remove-hero-spacer-section/reports/<date>-step-5-browser-verification.md`, including the curl N/A rationale from task 4.1

## 6. Build sanity

- [x] 6.1 `npm run build` succeeds
- [x] 6.2 Confirm no dependency change: `git diff main --stat -- package.json package-lock.json` is empty

## 7. Update Technical Documentation (MANDATORY)

- [x] 7.1 Check `AGENTS.md` §9 for any reference to the hero's spacer/`hero-next`/"Scroll to explore" target and update if present — none found, no update needed
- [x] 7.2 `grep -rln "hero-next"` (excluding `openspec/changes/archive/**`) — confirm only this change's own artifacts remain, no stale references elsewhere

## 8. OpenSpec sync

- [x] 8.1 **After merge**, sync `specs/hero-ctas/spec.md` into `openspec/specs/hero-ctas/spec.md` — verify the primary-CTA requirement's updated text and new `#career` scenario are present
- [x] 8.2 Archive this change (per CLAUDE.md §10 / `opsx:archive`)
