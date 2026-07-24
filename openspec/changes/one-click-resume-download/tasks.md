## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-68-61-one-click-resume-download` (Linear-provided branch name for JOS-68) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this is a documentation-first change. All
three ACs already ship in the merged tree (AC1 hero download link + static
`public/resume.pdf`; AC2 `resume_download` tracking via HeroCtas'
`data-analytics-event` annotation + AnalyticsTracker's click handler, with
two passing tests; AC3 static-only, no generation path). The only code edit
is a professional download filename. Applicable gates: the targeted
component test, `npx vitest run`, `npx tsc --noEmit`,
`npm run validate:content`, `npm run lint` (broken repo-wide, same skip),
and a `next build` sanity check. "Database state verification" and a live
dev-server curl are N/A — no server surface changes; the download is a
static asset and the tracking transport is unchanged from 7.1/7.3.
"OpenAPI documentation" is N/A — no new HTTP endpoint.
-->

## 1. Verify the already-shipped acceptance criteria (AC1, AC2, AC3)

- [x] 1.1 AC1 — confirm `public/resume.pdf` exists and is statically served, and that `components/HeroCtas.tsx` renders `<a href="/resume.pdf" download …>` (one-click, no intermediate step); confirm `HeroCtas.test.tsx` already asserts the `href` + `download` attribute
- [x] 1.2 AC2 — confirm `components/HeroCtas.tsx` carries `data-analytics-event="resume_download"` and that `components/AnalyticsTracker.tsx`'s click handler fires `track({ eventType: "resume_download", … })` for that annotation; confirm `AnalyticsTracker.test.tsx` has passing tests asserting the event fires on click
- [x] 1.3 AC3 — confirm there is no dynamic PDF-generation path anywhere (résumé is served purely as the static `public/resume.pdf` asset)
- [x] 1.4 Owner content check (non-code): confirm `public/resume.pdf` is the current pre-approved résumé version (flag to owner if uncertain; not a code blocker)

## 2. Polish: professional download filename (AC1 refinement)

- [x] 2.1 In `components/HeroCtas.tsx`, change the résumé link's bare `download` attribute to `download="Jose Munoz Elguezabal.pdf"` so the saved file has a professional name
- [x] 2.2 Tighten the `HeroCtas.test.tsx` assertion from "has a `download` attribute" to assert the explicit value `download="Jose Munoz Elguezabal.pdf"`
- [x] 2.3 Run `npx vitest run components/HeroCtas.test.tsx` and confirm it passes

## 3. Full verification (agent executes all of this itself)

- [x] 3.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 3.2 Run `npx tsc --noEmit` clean
- [x] 3.3 Run `npm run validate:content` clean
- [x] 3.4 Run `npm run lint` (note the pre-existing repo-wide failure if unchanged; skip with the same rationale as prior stories)
- [x] 3.5 Run `next build` as a sanity check and confirm the home route (hosting the hero résumé CTA) stays `○ Static`

## 4. OpenSpec sync

- [ ] 4.1 After merge, sync `specs/one-click-resume-download/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
