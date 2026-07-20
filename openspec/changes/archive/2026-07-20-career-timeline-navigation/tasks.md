## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-56-31-interactive-career-timeline-navigation` (Linear-provided branch name for JOS-56) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with the two prior changes on this repo,
there is no backend/database, so curl/database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This is a frontend
component change; applicable mandatory gates are TDD unit tests, `npx vitest
run`, `npx tsc --noEmit`, and in-browser manual verification (including
keyboard-only navigation and viewport-width checks) via claude-in-chrome
tools, all agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.1 Add a test to the existing `CareerChapters` suite: each chapter's `<details>` element has an `id` matching its experience id
- [x] 1.2 Create `components/CareerTimeline.test.tsx`: renders one node per experience passed in, in the same order
- [x] 1.3 Failing test: each node's visible text includes the company and formatted date range
- [x] 1.4 Failing test: each node's accessible name (`aria-label`) includes role, company, and date range
- [x] 1.5 Failing test: each node is an `<a>` with `href="#{experience.id}"` matching the corresponding chapter's id
- [x] 1.6 Failing test (SSR, `renderToStaticMarkup`, `components/CareerTimeline.ssr.test.tsx`): timeline nodes are present in server-rendered HTML with real `href`s
- [x] 1.7 Run the new tests and confirm they fail for the expected reason — confirmed: `Cannot find module './CareerTimeline'` (component didn't exist yet) and the chapter-id test failed with `id` received `null`

## 2. Implement

- [x] 2.1 Extract `formatMonthYear`/`formatChapterDateRange` from `CareerChapter.tsx` into `components/formatChapterDate.ts` (pure move, no behavior change)
- [x] 2.2 Add `id={experience.id}` to the `<details>` element in `CareerChapter.tsx`
- [x] 2.3 Create `components/CareerTimelineStyles.ts` with the responsive rail classes (fixed left rail at `md:` and up; static horizontally-scrollable in-flow strip below `md`)
- [x] 2.4 Create `components/CareerTimeline.tsx`: maps `experiences` to anchor nodes, no `"use client"` — server component
- [x] 2.5 Mount `<CareerTimeline experiences={experiences} />` in `app/page.tsx`, between the hero and `CareerChapters`

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Run `npx vitest run` and confirm all new tests pass and no regressions — 11 files, 52/52 tests pass
- [x] 3.2 Run `npx tsc --noEmit` and confirm no type errors — clean
- [x] 3.3 Run `npm run validate:content` and confirm it still passes — passes

## 4. Manual verification in browser (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Start the dev server and load the page via claude-in-chrome tools
- [x] 4.2 At a desktop-width viewport, verify the timeline rail renders on the left with real company names and date ranges, and clicking a node scrolls to the matching chapter — confirmed: both nodes render (Oracle Corporation, Envato (Placeit.net)) with correct dates; clicking the Envato node set the URL to `#envato` and landed on that chapter
- [x] 4.3 Resize to a mobile-width viewport and verify the timeline is still visible — **could not visually confirm via live rendering**: `resize_window` did not change the tab's actual CSS viewport in this automation environment (`window.innerWidth` stayed 1677px after requesting 390px). Verified instead by inspecting the rendered `class` attribute directly: it carries both the unprefixed mobile-default utilities (`flex overflow-x-auto px-6 pb-6`, in-flow, no `hidden`) and the `md:`-prefixed overrides — standard Tailwind mobile-first CSS, so the unprefixed rules are what apply below the 768px breakpoint. No `hidden`/`md:hidden` utility is used anywhere in `CareerTimelineStyles.ts` (confirmed by inspection), so the nodes are never removed from the DOM or accessibility tree at any width by construction.
- [x] 4.4 Tab through the page with the keyboard and verify every timeline node receives visible focus and Enter activates it — confirmed at the available (desktop) viewport: 4 Tabs from page load reached the Oracle node (`:focus-visible` true, visible outline ring confirmed via screenshot), a 5th Tab reached the Envato node (`:focus-visible` true). Enter-activation follows from native anchor semantics, already proven equivalent to the click-navigation verified in 4.2. Mobile-width keyboard re-test wasn't separately achievable (same viewport limitation as 4.3), but focusability doesn't depend on viewport in this implementation (no conditional `tabindex`/`hidden` by breakpoint)
- [x] 4.5 Verify timeline nodes and their real `href`s are present in the server-rendered HTML — confirmed both via the dedicated `CareerTimeline.ssr.test.tsx` (`renderToStaticMarkup`, passing) and by inspecting the live page's DOM, which contains `href="#oracle"` and `href="#envato"` — this component ships no client JS at all (no `"use client"`), so there is no client-rendering step to differ from SSR output

## 5. Documentation and review

- [x] 5.1 Confirm no technical documentation needs updating — confirmed, no changes needed
- [x] 5.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — reviewed, including manual mobile/narrow-viewport verification, approved, and merged via PR #11
