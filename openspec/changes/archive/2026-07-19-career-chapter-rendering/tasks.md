## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm `main` is up to date (fetch + fast-forward if needed) — confirmed via `git fetch` + comparing `git log -1 main` against `git log -1 origin/main`
- [x] 0.2 Create feature branch `feature/jos-82-career-chapter-rendering` from up-to-date `main`
- [x] 0.3 Verify branch creation and current branch status

## 1. TDD: `getExperiences()` Tests (write first, expect failing)

- [x] 1.1 Write failing test: `getExperiences()` returns one entry per file under a fixture `content/experience/` directory, each parsed through `ExperienceSchema`
- [x] 1.2 Write failing test: each returned entry has an `id` matching its filename without extension
- [x] 1.3 Write failing test: entries are sorted by `dates.start` descending (most recent first)
- [x] 1.4 Confirm all new tests fail (`getExperiences()` does not exist yet) — confirmed, 4/4 failed with `TypeError: getExperiences is not a function`

## 2. Implementation: `getExperiences()`

- [x] 2.1 Add `getExperiences()` to `lib/content/read.ts`, using `readdirSync`/`basename`/`extname` (mirroring `validate.ts`'s existing pattern) and `ExperienceSchema.parse()` — added `contentRoot` as an optional parameter (defaulting to the real content dir) so it's testable against fixtures, matching `validate.ts`'s existing pattern for the same reason
- [x] 2.2 Run the Step 1 test suite and confirm all tests now pass — 4/4 passed

## 3. TDD: Chapter Component Tests (write first, expect failing)

- [x] 3.1 Write failing test: renders one collapsed chapter per entry from a fixture list of 2 experiences (proves multi-chapter scaling, per design.md's synthetic-fixture mitigation)
- [x] 3.2 Write failing test: collapsed state shows role, company, mission, and a formatted date range; does not show the seven-element expanded content
- [x] 3.3 Write failing test: expanding a chapter renders all seven §F3 elements in order (role header, context, responsibilities, projects with metrics, leadership, technologies, lessons)
- [x] 3.4 Write failing test: the expand/collapse control is a native `<details>`/`<summary>` element (not a custom button + conditional render)
- [x] 3.5 Write failing test: date-range formatting handles both an ended chapter (`start`–`end`) and an ongoing chapter (`start`–`Present`)
- [x] 3.6 Confirm all new tests fail (component does not exist yet) — confirmed via unresolved import error

## 4. Implementation: Chapter Components

- [x] 4.1 Add chapter-list/chapter style constants to a new `components/CareerChaptersStyles.ts`, following the `HeroShellStyles.ts` pattern
- [x] 4.2 Create `components/CareerChapter.tsx`: renders one chapter as `<details>`/`<summary>`, collapsed summary content per design.md Decision 2, expanded seven-element body per Decision 3's ordering — role header lives inside `<summary>` (always visible, native semantics), the other six sections are `<summary>`'s siblings (hidden until `open`, per native `<details>` behavior)
- [x] 4.3 Create `components/CareerChapters.tsx`: accepts a list of experiences, maps each to `<CareerChapter>`
- [x] 4.4 Render `<CareerChapters experiences={getExperiences()} />` in `app/page.tsx`, positioned directly below `HeroFramer`'s `#hero-next` spacer per design.md Decision 1
- [x] 4.5 Run the Step 3 test suite and confirm all tests now pass — 5/6 passed as originally written; one assertion ("collapsed content not queryable via `getByRole`") was removed because jsdom does not implement the browser's native closed-`<details>` accessibility-tree exclusion, so it was testing a jsdom/RTL limitation rather than real product behavior. The `open === false` assertion (still present, passing) is the correct, robust proof of "collapsed by default" for a native element; real visual collapse is verified against actual Chrome rendering in Step 8.

## 5. Review and Update Existing Unit Tests (MANDATORY)

- [x] 5.1 Run the full existing suite (`npm test`) to confirm no prior test broke — 31/31 passed (22 pre-existing + 4 new `getExperiences()` tests + 5 new `CareerChapters` tests), 6 test files
- [x] 5.2 Reviewed: no existing `lib/content` test needs extension — `ExperienceSchema` parsing is already covered by `content.test.ts`/`validate.test.ts`, and `getExperiences()`'s own new behavior (id computation, sort order, file reading) is covered by the new `read.test.ts`. No gap found.

## 6. Run Unit Tests and Verify State (MANDATORY)

- [x] 6.1 Run `npx tsc --noEmit` — clean
- [x] 6.2 Run `npm test` (full suite) — 31/31 passed
- [x] 6.3 Run `npm run validate:content` — exit 0
- [x] 6.4 Run `npm run build` — succeeds
- [x] 6.5 Create report `openspec/changes/career-chapter-rendering/reports/2026-07-19-step-6-unit-test-verification.md`
- [x] 6.6 Mark this step complete only after all checks pass and the report exists

## 7. Manual Endpoint Testing with curl — Not Applicable

- [x] 7.1 Documented in the Step 6 report that this story introduces no HTTP API endpoints

## 8. Browser/E2E Verification (MANDATORY — Claude in Chrome confirmed connected)

- [x] 8.1 Start `next dev` (or reuse a running instance) and navigate to the page — restarted the dev server fresh (`.next` cleared) for a clean run
- [x] 8.2 Screenshot/verify: the real Oracle chapter renders collapsed by default with role, company, mission, and date range — confirmed
- [x] 8.3 Click the chapter's summary and verify it expands to show all seven §F3 elements in order, with real Oracle content — confirmed via keyboard activation (see 8.4)
- [x] 8.4 Test keyboard-only operation: Tab to the chapter's summary, verify a visible focus indicator, press Enter (or Space) and verify it expands; repeat to collapse — confirmed: disabled Ask AI button correctly skipped in tab order, visible focus outline present, Enter toggles `open` both directions
- [x] 8.5 Verify the JOS-53/54 hero (entrance animation, scroll-exit, CTAs) still renders and functions correctly above the new section — no regression
- [x] 8.6 Document outcomes (with screenshots) in `openspec/changes/career-chapter-rendering/reports/2026-07-19-step-8-browser-verification.md`

## 9. Update Technical Documentation (MANDATORY)

- [x] 9.1 Updated `README.md`: added a note on `getExperiences()` and the `<details>`/`<summary>` chapter-rendering pattern to the Content model section
- [x] 9.2 Confirmed no other documentation needs updating — this story consumes the existing `Experience` schema without changing the content model
