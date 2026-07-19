## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm `main` is up to date (fetch + fast-forward if needed) — confirmed at `ea83d37`
- [x] 0.2 Create feature branch `feature/jos-83-chapter-technology-evidence-linking` from up-to-date `main`
- [x] 0.3 Verify branch creation and current branch status

## 1. TDD: Technology Link Tests (write first, expect failing)

- [x] 1.1 Write failing test: each technology in the Technologies section renders as an `<a>` element (not plain text)
- [x] 1.2 Write failing test: a technology's `href` equals `#{chapterId}-projects`
- [x] 1.3 Write failing test: the chapter's Projects section has `id="{chapterId}-projects"`
- [x] 1.4 Write failing test: a technology link's accessible name includes both the technology name and an indication of its destination
- [x] 1.5 Write failing test: with two fixture chapters, each chapter's technology links target only that chapter's own Projects section (no cross-chapter id collision)
- [x] 1.6 Confirm all new tests fail (technology is still plain text, no `id` on Projects section) — confirmed, 5/5 failed

## 2. Implementation

- [x] 2.1 Add `chapterTechLinkClass` to `components/CareerChaptersStyles.ts`; use Tailwind's built-in `sr-only` utility directly for the hidden suffix (no custom class needed)
- [x] 2.2 Add `id={`${experience.id}-projects`}` to the Projects `<section>` in `components/CareerChapter.tsx`
- [x] 2.3 Change each technology `<li>` in `components/CareerChapter.tsx` to render an `<a href="#{experience.id}-projects">` containing the visible technology name plus a visually-hidden "— jump to Projects" span
- [x] 2.4 Run the Step 1 test suite and confirm all tests now pass — 5/5 passed

## 3. Review and Update Existing Unit Tests (MANDATORY)

- [x] 3.1 Run the full existing suite (`npm test`) to confirm no prior test broke — 40/40 passed (35 pre-existing + 5 new), 8 test files
- [x] 3.2 Reviewed both files: `CareerChapters.test.tsx`'s existing `getByText("JavaScript")` assertion (technology text inside the "expands to render seven elements" test) still resolved correctly despite the technology now being wrapped in an `<a>` with an added `sr-only` suffix span — no update needed. `CareerChapters.ssr.test.tsx` doesn't assert on technology markup shape specifically (only content-presence strings), unaffected.

## 4. Run Unit Tests and Verify State (MANDATORY)

- [x] 4.1 Run `npx tsc --noEmit` — clean
- [x] 4.2 Run `npm test` (full suite) — 40/40 passed
- [x] 4.3 Run `npm run validate:content` — exit 0
- [x] 4.4 Run `npm run build` — succeeds; also manually verified the compiled `sr-only` CSS rule is correct
- [x] 4.5 Create report `openspec/changes/chapter-technology-evidence-linking/reports/2026-07-19-step-4-unit-test-verification.md`
- [x] 4.6 Mark this step complete only after all checks pass and the report exists

## 5. Manual Endpoint Testing with curl — Not Applicable

- [x] 5.1 Documented in the Step 4 report that this story introduces no HTTP API endpoints

## 6. Browser/E2E Verification (MANDATORY — Claude in Chrome confirmed connected)

- [x] 6.1 Start `next dev` (or reuse a running instance) and navigate to the page
- [x] 6.2 Expand the real Oracle chapter and verify each technology renders as a visibly distinct link — confirmed
- [x] 6.3 Click a technology link and verify the page scrolls to that chapter's Projects section — confirmed via URL hash (`#oracle-projects`) and screenshot landing on the PROJECTS heading
- [x] 6.4 Inspect a technology link's computed accessible name and confirm it includes the destination indication — confirmed: "Oracle Cloud Infrastructure (OCI) — jump to Projects"
- [x] 6.5 Verify no regression to the rest of the chapter (expand/collapse, other §F3 sections, chevron from JOS-84) — confirmed, `details.open` unaffected, hero unaffected
- [x] 6.6 Document outcomes (with screenshots) in `openspec/changes/chapter-technology-evidence-linking/reports/2026-07-19-step-6-browser-verification.md`

## 7. Update Technical Documentation (MANDATORY)

- [x] 7.1 Updated `README.md` with a note on the technology-to-Projects linking pattern and why
- [x] 7.2 Confirmed no other documentation needs updating — this story consumes existing content fields without changing the content model
