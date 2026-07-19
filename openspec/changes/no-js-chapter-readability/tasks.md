## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm `main` is up to date (fetch + fast-forward if needed) — confirmed, local main matched origin/main at `7591740`
- [x] 0.2 Create feature branch `feature/jos-84-no-js-chapter-readability` from up-to-date `main`
- [x] 0.3 Verify branch creation and current branch status

## 1. Tests: SSR Content Presence and No-JS Affordance (write first)

- [x] 1.1 Write test: rendering `<CareerChapters>` via `react-dom/server`'s `renderToStaticMarkup` (no jsdom, no browser) produces HTML containing every one of a fixture chapter's seven-section content strings — proves content presence independent of any client-side rendering
- [x] 1.2 Write test: the rendered static HTML contains plain `<details>`/`<summary>` tags (not gated behind any other wrapper)
- [x] 1.3 Write test: the summary contains a chevron element (`aria-hidden="true"`) whose class list includes a `group-open:` rotation utility and the summary's class list includes `[&::-webkit-details-marker]:hidden`
- [x] 1.4 Run this suite once before implementing the chevron: confirm 1.1/1.2 already pass (honest finding — JOS-82's architecture already satisfies content-presence and native-toggle requirements) while 1.3 fails (chevron doesn't exist yet) — confirmed exactly this split: 2/4 passed (content presence, native `<details><summary>` structure), 2/4 failed (chevron element and marker-hiding class, neither implemented yet)
- [x] 1.5 Documented: this split is the expected, honest result of this story's actual premise (verification, not net-new feature-building) — not treated as a bug

## 2. Implementation: Visible Expand/Collapse Indicator

- [x] 2.1 Add `chapterChevronClass` to `components/CareerChaptersStyles.ts`; update `chapterSummaryClass` to add `[&::-webkit-details-marker]:hidden` alongside its existing `list-none`
- [x] 2.2 Render an `aria-hidden="true"` chevron `<span>` inside `CareerChapter.tsx`'s `<summary>`, using `group-open:rotate-90` (relies on `chapterDetailsClass`'s existing `group` class)
- [x] 2.3 Run the Step 1 test suite and confirm all tests (including 1.3) now pass — 4/4 passed

## 3. Review and Update Existing Unit Tests (MANDATORY)

- [x] 3.1 Run the full existing suite to confirm no prior test broke — one JOS-82 test needed a real update (see 3.2), all others unaffected
- [x] 3.2 Reviewed `components/CareerChapters.test.tsx`: `getByText("Engineer at Acme")` calls (collapsed-summary and closest-summary lookups) still resolved correctly despite the chevron — RTL's text matching tolerated the added inline content. The one real break was the exact `headingTexts` array-equality check, whose first expected entry literally became `"▸ Engineer at Acme"` since it compares raw `.textContent` (not RTL's normalizer) — updated to match, since this accurately reflects the new real DOM content, not a workaround

## 4. Run Unit Tests and Verify State (MANDATORY)

- [x] 4.1 Run `npx tsc --noEmit` — clean
- [x] 4.2 Run `npm test` (full suite) — 35/35 passed
- [x] 4.3 Run `npm run validate:content` — exit 0
- [x] 4.4 Run `npm run build` — succeeds; also manually verified the compiled CSS output contains correct, working `group-open:` and `[&::-webkit-details-marker]:hidden` rules (not just assumed from Tailwind's docs, per design.md's stated commitment)
- [x] 4.5 Create report `openspec/changes/no-js-chapter-readability/reports/2026-07-19-step-4-unit-test-verification.md`
- [x] 4.6 Mark this step complete only after all checks pass and the report exists

## 5. Manual Endpoint Testing with curl — Not Applicable

- [x] 5.1 Documented in the Step 4 report that this story introduces no HTTP API endpoints

## 6. Browser/E2E Verification (MANDATORY — Claude in Chrome confirmed connected)

- [x] 6.1 Retry real per-tab JavaScript-disable via the browser extension — tried both `chrome://settings/content/javascript` navigation and the DevTools keyboard shortcut (`cmd+alt+i`); both still blocked, confirmed not achievable via this tooling
- [x] 6.2 N/A — real JS-disable not achievable (see 6.1)
- [x] 6.3 Fell back to `curl`-based SSR HTML inspection plus the Section 1/4 `renderToStaticMarkup` unit tests as the documented verification method, honestly reported rather than claimed as a full live test
- [x] 6.4 With JavaScript enabled, confirmed the chevron is visible on the collapsed chapter, rotates from `▸` to `▾` on click (verified via zoomed screenshot and `details.open === true`), and checked the console for hydration warnings — none found, only routine HMR logs
- [x] 6.5 Documented outcomes (with screenshots) in `openspec/changes/no-js-chapter-readability/reports/2026-07-19-step-6-browser-verification.md`

## 7. Update Technical Documentation (MANDATORY)

- [x] 7.1 Updated `README.md` with a note on the CSS-only chevron mechanism
- [x] 7.2 Confirmed the `career-chapter-rendering` main spec will pick up this change's delta spec requirements once archived — no other documentation needs updating
