## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-79-13b-two-polished-chapters-phase-2-quality-gate` (Linear-provided branch name for JOS-79) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: docs/openspec-tasks-mandatory-steps.md's
default checklist (curl endpoint testing, database state verification,
Playwright E2E) targets a backend/database stack this repo does not have —
CLAUDE.md explicitly documents CareerDNA as static content + React
components with no backend/database (see "Not yet built" in CLAUDE.md §9).
The mandatory verification/agent-must-execute intent is preserved below via
this repo's actual gates: `npm run validate:content`, `npx vitest`, and
in-browser verification of the rendered chapter (per CLAUDE.md's "test the
feature in a browser" rule for UI changes).
-->

## 1. Gather raw content

- [x] 1.1 Collect business context for the Envato/Placeit role (what problem the org faced) from the site owner
- [x] 1.2 Collect 2-4 projects with outcomes and at least one metric each
- [x] 1.3 Collect one leadership highlight (concrete story)
- [x] 1.4 Collect technologies/tools used in the role
- [x] 1.5 Collect a lessons-learned reflection (1-2 sentences, human voice)
- [x] 1.6 Confirm role dates and one-line mission against the resume (Mar 2019 - Nov 2021, Project Delivery Manager)

## 2. Author the chapter content

- [x] 2.1 Draft `content/experience/envato.yaml` following the `content/experience/oracle.yaml` field structure and the `Experience` schema (`lib/content/schemas.ts`)
- [x] 2.2 Verify all seven §F3 elements are present: company/role/dates/mission, business context, responsibilities, 2-4 projects with outcomes/metrics, leadership highlight, technologies, lessons learned
- [x] 2.3 Update `content/skills.yaml` so every technology/skill claimed in the new chapter has an evidence entry referencing `envato` (add new skill entries only for skills genuinely new to this role)
- [x] 2.4 Confirm no fictional/placeholder content was introduced

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Run `npm run validate:content` and confirm it passes with no errors against the updated `/content` tree
- [x] 3.2 Run `npx vitest run` and confirm no regressions (content/lib tests use isolated fixtures per `chapter-content-template` spec, so they should be unaffected) — 8 files, 40 tests passed
- [x] 3.3 Run `npx tsc --noEmit` and confirm no type errors

## 4. Manual verification in browser (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Start the dev server (`npm run dev`)
- [x] 4.2 Open the career chapters section in the browser and confirm the Envato chapter renders alongside Oracle's
- [x] 4.3 Expand the Envato chapter (`<details>`/`<summary>`) and verify all seven §F3 elements render correctly
- [x] 4.4 Verify technologies listed link to/are traceable via the skills/evidence section (F4) — each technology links to `#envato-projects` per the existing per-chapter evidence-linking pattern
- [x] 4.5 Spot-check no-JS readability is unaffected (chapter content present in initial HTML, not JS-only rendered) — confirmed via `get_page_text` before any interaction

## 5. Documentation and review

- [x] 5.1 Update any technical documentation referencing chapter count/status if applicable (check `docs/PRD.md` progress notes, `README.md`) — reviewed both; no chapter-count/status tracker exists to update, no changes needed
- [x] 5.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — reviewed and merged via PR #9
