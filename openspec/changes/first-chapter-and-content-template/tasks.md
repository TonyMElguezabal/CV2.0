## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/jos-78-first-chapter-and-content-template` from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Shared Test Fixture Extraction (regression-gated refactor)

- [x] 1.1 Extract `lib/content/test-fixtures.ts` (not a `.test.ts` file) with `makeFixtureRoot()` and the `VALID_PROFILE`/`VALID_EXPERIENCE`/`VALID_PROJECT`/`VALID_SKILLS` constants, moved out of `validate.test.ts`'s existing private copy
- [x] 1.2 Update `validate.test.ts` to import from the shared module instead of its own private helper
- [x] 1.3 Run `validate.test.ts` and confirm all its existing tests still pass unchanged — regression gate for the extraction

## 2. Decouple content.test.ts from Real Content

- [x] 2.1 Refactor `lib/content/content.test.ts` to build fixtures via the shared `makeFixtureRoot()` (from §1) instead of reading the literal real `/content` directory
- [x] 2.2 Generalize assertions that referenced placeholder-specific values (e.g., the `acme-corp` chapter ID) into shape-only checks, so the suite is agnostic to what real content exists. Also extended `makeFixtureRoot()` with a `faq.md` fixture so the FAQ scenario moved off real content too, consistent with the broader decoupling intent (spec Requirement 5), not just the two files being deleted
- [x] 2.3 Run `content.test.ts` and confirm all 6 tests still pass against the temp fixtures

## 3. Chapter Authoring Template

- [x] 3.1 Write `docs/content-authoring-guide.md`: explain the seven §F3 elements and why they matter, followed by a fenced-YAML template with every field present and inline placeholder comments
- [x] 3.2 Reference `content/experience/oracle.yaml` (added in §4) in the guide as the real worked example
- [x] 3.3 Add a linking sentence from `README.md`'s content-model section to the new guide (also fixed the pre-existing ID-convention example, which referenced the now-retired `acme-corp` slug)

## 4. Author the Real Oracle Chapter

- [x] 4.1 Write `content/experience/oracle.yaml` with the approved content: role, dates (`2021-11`–`2026-01`), business context, 6 responsibilities, 4 projects (title/outcome/metrics), one leadership story, technologies, lessons learned
- [x] 4.2 Update `content/skills.yaml` to reference only the real `oracle` slug, removing fictional evidence entries (4 real skill entries: Technical Program Leadership, AI/RAG Solution Delivery, Stakeholder Management, People Leadership & Conflict Resolution)

## 5. Retire Fictional Fixtures

- [x] 5.1 Delete `content/experience/acme-corp.yaml`
- [x] 5.2 Delete `content/projects/dashboard-revamp.md` (this leaves `content/projects/` empty — expected, since 1.3a's scope doesn't require standalone project files; git doesn't track the now-empty directory until Epic 4 adds real ones)
- [x] 5.3 Confirm no remaining reference to `acme-corp` or `dashboard-revamp` anywhere under `/content`

## 6. Verify Real Content Passes Validation

- [x] 6.1 Run `npm run validate:content` against the real, updated `/content` directory and confirm exit code 0 with no output
- [x] 6.2 Run the full test suite (`npm test`) and confirm all tests pass, including §1/§2's regression-gated suites

## 7. Review and Update Existing Unit Tests (MANDATORY)

- [x] 7.1 Review the refactored and new tests against `specs/chapter-content-template/spec.md` — confirm one test (or manual verification, per §6) covers each scenario. Coverage: Req 1 (both scenarios via §3 + §6.1), Req 2 (§4 + Zod enforcement), Req 3 (§5.3 grep), Req 4 (§6.1), Req 5 (§1/§2 refactor — both test files now import `makeFixtureRoot()`, neither reads real `/content`)
- [x] 7.2 Confirm `validate.test.ts` and `content.test.ts` both pass post-refactor, and that neither depends on real `/content` file contents anymore

## 8. Run Unit Tests and Verify State (MANDATORY, adapted for a database-free story)

- [x] 8.1 Run the full test suite (`npm test`) and capture pass/fail/skip counts
- [x] 8.2 Confirm all tests pass with zero failures
- [x] 8.3 Create a verification report at `openspec/changes/first-chapter-and-content-template/reports/YYYY-MM-DD-step-8-unit-test-verification.md` documenting commands executed and results. **Note**: this story touches no database — same rationale as Stories 1.1/1.2 — so the report's "database state" section is marked N/A.
- [x] 8.4 Mark this step complete only after the report exists and all tests pass

## 9. Manual Endpoint Testing with curl — Not Applicable

- [x] 9.1 Record in the section-8 report that this story introduces zero HTTP endpoints (content authoring, a documentation guide, and test refactors only), so curl testing does not apply

## 10. E2E Testing with Playwright MCP — Not Applicable

- [x] 10.1 Record in the section-8 report that this story introduces no UI and no user-facing workflow, so Playwright E2E testing does not apply

## 11. Update Technical Documentation (MANDATORY)

- [x] 11.1 Confirm `README.md`'s content-model section links to the new `docs/content-authoring-guide.md` (from §3.3)
- [x] 11.2 Verify `docs/PRD.md` §6/§F3 still accurately describe the implemented chapter shape — **found a real gap, not a rubber-stamp**: §F3 item 1 requires "Company, role, dates, one-line mission," but `ExperienceSchema` only had `role`/`dates`. Fixed: added `company`/`mission` fields to the schema (Stories 1.1/1.2's code, touched again), `oracle.yaml`, the authoring guide's template, and test fixtures/assertions. Confirmed with the site owner before adding the new "mission" one-liner, since it's new characterizing text about their real role. Full regression clean after the fix (16/16 tests, `validate:content` exit 0)
- [x] 11.3 If any implementation decision diverged from `design.md`, update `design.md`'s Open Questions or Decisions to reflect what was actually built
