## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/jos-51-build-time-content-validation` from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Schema Foundation (Zod, behavior-preserving refactor of Story 1.1's types)

- [x] 1.1 Add `zod` as a dependency
- [x] 1.2 Create `lib/content/schemas.ts` with `ProfileSchema`, `ExperienceSchema`, `ProjectSchema`, `SkillSchema` (and sub-schemas) matching the exact shapes currently hand-written in `lib/content/types.ts`
- [x] 1.3 Define the shared `dateStringSchema` (`YYYY-MM` or `YYYY-MM-DD`, validated as a real calendar date) per design.md Decision 2
- [x] 1.4 Refactor `lib/content/types.ts` so each exported type is `z.infer<typeof XSchema>` instead of a hand-written interface, preserving the exact field shape
- [x] 1.5 Run Story 1.1's existing test suite (`npm test`) and confirm all 6 tests still pass unchanged — this is the regression gate for the refactor

## 2. Validator Core (TDD — failing test before implementation)

- [x] 2.1 Write a failing test in `lib/content/validate.test.ts` asserting `validateContent()` against the real `/content` directory returns `{ valid: true, errors: [] }`
- [x] 2.2 Implement `validateContent(contentRoot?: string): ValidationResult` in `lib/content/validate.ts`: reads and Zod-validates `profile.yaml`, every `experience/*.yaml`, every `projects/*.md` (frontmatter via `gray-matter`), and `skills.yaml`; starts with an empty `errors` array
- [x] 2.3 Confirm the test from 2.1 passes against the real content tree

- [x] 2.4 Write a failing test using a temporary fixture directory (per design.md Decision 3) containing an experience file missing a required field, asserting `validateContent(tempDir)` returns an error naming that file and field
- [x] 2.5 Implement missing-required-field detection using each schema's Zod issues, mapped into `ValidationError { file, field, message }`
- [x] 2.6 Confirm the test from 2.4 passes

- [x] 2.7 Write a failing test using a temporary fixture directory containing a `skills.yaml` entry whose evidence references a non-existent slug, asserting the result is invalid with an error identifying the dangling reference
- [x] 2.8 Implement dangling-reference detection: compute known slugs fresh from the temp/real experience and projects directories at validation time, per design.md Decision 6
- [x] 2.9 Confirm the test from 2.7 passes
- [x] 2.10 Write a test using a temporary fixture directory where every evidence ID resolves correctly, asserting no dangling-reference error is reported
- [x] 2.11 Confirm the test from 2.10 passes

- [x] 2.12 Write a failing test using a temporary fixture directory containing an experience file with a malformed date (e.g., `"2021-13"`), asserting the result is invalid with an error naming the file and field
- [x] 2.13 Confirm `dateStringSchema` (from 1.3) rejects the malformed value and the test from 2.12 passes
- [x] 2.14 Write a test using a temporary fixture directory with valid `YYYY-MM` and `YYYY-MM-DD` dates, asserting no malformed-date error is reported
- [x] 2.15 Confirm the test from 2.14 passes

- [x] 2.16 Write a test using a temporary fixture directory containing both a missing-field issue in one file and a dangling reference in another, asserting the result's `errors` array contains both — not only the first encountered
- [x] 2.17 Confirm `validateContent()` accumulates all issues across the tree (per design.md Decision 5) and the test from 2.16 passes

## 3. CLI Entry Point (TDD)

- [x] 3.1 Write a failing test asserting a CLI helper function (extracted for testability, e.g. `formatCliOutput(result: ValidationResult)`) renders each error as `file: field: message`
- [x] 3.2 Implement `lib/content/cli.ts`: calls `validateContent()`, prints formatted output, calls `process.exit(result.valid ? 0 : 1)`
- [x] 3.3 Confirm the test from 3.1 passes
- [x] 3.4 Add the `"validate:content": "node lib/content/cli.ts"` script to `package.json`
- [x] 3.5 Manually run `npm run validate:content` against the real `/content` directory and confirm it exits 0 with no output — required two fixes discovered only at this manual-run step (see design.md Implementation Notes): explicit `.ts` extensions on relative imports and `import.meta.dirname` in place of `__dirname`, since raw Node ESM lacks CommonJS globals that Vitest's transform had been silently shimming

## 4. Review and Update Existing Unit Tests (MANDATORY)

- [x] 4.1 Review all tests written in sections 1–3 against `specs/content-validation/spec.md` — confirm one test covers each scenario. Coverage: Req 1 (1 test), Req 2 (2 tests), Req 3 (2 tests), Req 4 (1 test), Req 5 (1 test), Req 6 (both scenarios verified manually — zero-exit in 3.5, non-zero-exit via a temporary break-and-restore against real `profile.yaml`, restored clean per `git diff`)
- [x] 4.2 Re-run Story 1.1's `content.test.ts` suite and confirm it still passes after the `types.ts` refactor (final confirmation, in addition to 1.5)

## 5. Run Unit Tests and Verify State (MANDATORY, adapted for a database-free story)

- [x] 5.1 Run the full test suite (`npm test`) and capture pass/fail/skip counts
- [x] 5.2 Confirm all tests pass with zero failures, including Story 1.1's pre-existing suite
- [x] 5.3 Create a verification report at `openspec/changes/build-time-content-validation/reports/YYYY-MM-DD-step-5-unit-test-verification.md` documenting commands executed and results. **Note**: this story touches no database — same rationale as Story 1.1 — so the report's "database state" section is marked N/A.
- [x] 5.4 Mark this step complete only after the report exists and all tests pass

## 6. Manual Endpoint Testing with curl — Not Applicable

- [x] 6.1 Record in the section-5 report that this story introduces zero HTTP endpoints (a validation library and CLI script only), so curl testing does not apply

## 7. E2E Testing with Playwright MCP — Not Applicable

- [x] 7.1 Record in the section-5 report that this story introduces no UI and no user-facing workflow, so Playwright E2E testing does not apply

## 8. Update Technical Documentation (MANDATORY)

- [x] 8.1 Update the root `README.md`'s Development section to document `npm run validate:content` and what it checks
- [x] 8.2 Verify `docs/PRD.md` §6 still accurately describes the implemented validation behavior (no edits expected — confirmation only)
- [x] 8.3 If any implementation decision diverged from `design.md`, update `design.md`'s Open Questions or Decisions to reflect what was actually built
