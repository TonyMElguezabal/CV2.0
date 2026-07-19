## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/jos-50-content-file-structure` from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Project Scaffold

- [x] 1.1 Initialize root `package.json` (private, minimal, no framework deps) per design.md Decision 1
- [x] 1.2 Add `typescript`, `vitest`, `yaml`, `gray-matter` as dependencies
- [x] 1.3 Create `tsconfig.json` with strict mode enabled
- [x] 1.4 Create `vitest.config.ts`
- [x] 1.5 Add a `test` script to `package.json` that runs Vitest

## 2. Content Type Definitions (TDD — failing test before implementation)

- [x] 2.1 Write a failing test in `lib/content/content.test.ts` asserting `content/profile.yaml` parses into the expected `Profile` shape
- [x] 2.2 Define the `Profile` TypeScript interface in `lib/content/types.ts` (name, positioning, summary, links, contact)
- [x] 2.3 Create the example `content/profile.yaml` fixture matching the `Profile` shape
- [x] 2.4 Confirm the test from 2.1 passes

- [x] 2.5 Write a failing test asserting an `experience/<company>.yaml` file parses into the expected `Experience` shape
- [x] 2.6 Define the `Experience` TypeScript interface (role, dates, context, responsibilities, projects, leadership, technologies, lessons)
- [x] 2.7 Create the example `content/experience/acme-corp.yaml` fixture
- [x] 2.8 Confirm the test from 2.5 passes

- [x] 2.9 Write a failing test asserting a `projects/<project>.md` file's frontmatter and body parse into the expected `Project` shape
- [x] 2.10 Define the `Project` TypeScript interface (title, company, skills, metrics) and the expected narrative-body shape
- [x] 2.11 Create the example `content/projects/dashboard-revamp.md` fixture with frontmatter plus a problem/approach/outcome body
- [x] 2.12 Confirm the test from 2.9 passes

- [x] 2.13 Write a failing test asserting `skills.yaml` entries reference existing experience/project filename slugs
- [x] 2.14 Define the `Skill` TypeScript interface (name, evidence: string[])
- [x] 2.15 Create the example `content/skills.yaml` fixture referencing the `acme-corp` and `dashboard-revamp` slugs created above
- [x] 2.16 Confirm the test from 2.13 passes

- [x] 2.17 Write a failing test asserting `faq.md` contains at least one parsable question/answer pair
- [x] 2.18 Create the example `content/faq.md` fixture with at least one Q&A pair
- [x] 2.19 Confirm the test from 2.17 passes

- [x] 2.20 Write a failing test asserting every content type file from the spec's "Content file structure" requirement exists under `/content`
- [x] 2.21 Confirm the test from 2.20 passes

## 3. Review and Update Existing Unit Tests (MANDATORY)

- [x] 3.1 Review all tests written in section 2 against `specs/content-model/spec.md` — confirm one test covers each scenario
- [x] 3.2 Confirm no pre-existing tests are impacted (none exist prior to this change — first application code in the repo)

## 4. Run Unit Tests and Verify State (MANDATORY, adapted for a database-free story)

- [x] 4.1 Run the full test suite (`npm test`) and capture pass/fail/skip counts
- [x] 4.2 Confirm all tests from section 2 pass with zero failures
- [x] 4.3 Create a verification report at `openspec/changes/content-file-structure/reports/YYYY-MM-DD-step-4-unit-test-verification.md` documenting the commands executed and results. **Note**: this story touches no database — content is file-based, and the project's only database is the unrelated visitor-analytics store (Story 7.3) — so the report's "database state" section is marked N/A with that rationale recorded.
- [x] 4.4 Mark this step complete only after the report exists and all tests pass

## 5. Manual Endpoint Testing with curl — Not Applicable

- [x] 5.1 Record in the section-4 report that this story introduces zero HTTP endpoints (content files, types, and tests only), so curl testing does not apply

## 6. E2E Testing with Playwright MCP — Not Applicable

- [x] 6.1 Record in the section-4 report that this story introduces no UI, no user-facing workflow, and no frontend/backend integration, so Playwright E2E testing does not apply

## 7. Update Technical Documentation (MANDATORY)

- [x] 7.1 Add a root-level `README.md` documenting the project purpose (link to `docs/PRD.md`), the `/content` directory layout, the filename-slug ID convention, and how to run tests (`npm test`)
- [x] 7.2 Verify `docs/PRD.md` §6 still accurately describes the implemented content model (no edits expected — confirmation only)
- [x] 7.3 If any implementation decision diverged from `design.md`, update `design.md`'s Open Questions or Decisions to reflect what was actually built
