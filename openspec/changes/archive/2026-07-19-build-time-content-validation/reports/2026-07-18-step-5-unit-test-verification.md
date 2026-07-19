# Step 5 Report - Unit Tests and State Verification

- Date: 2026-07-18
- Change: build-time-content-validation
- Story: JOS-51 ([1.2] Build-time content validation)
- Agent: Claude Code

## Commands Executed

- `npx tsc --noEmit` — strict-mode type check
- `npm test` (`vitest run`)
- `npm run validate:content` — manual CLI run against the real `/content` directory
- A temporary break-and-restore of `content/profile.yaml` to manually verify the CLI's non-zero-exit path (see Manual Verification below)

## Unit Test Results

- Targeted tests (this story): 10 passed, 0 failed, 0 skipped (`validate.test.ts`: 7, `cli.test.ts`: 3)
- Full/required suite: 16 passed, 0 failed, 0 skipped, across 3 test files — includes Story 1.1's pre-existing 6 tests (`content.test.ts`), confirmed unaffected by the `types.ts` refactor
- Type check: clean (0 errors)
- Runtime: ~250ms per run
- Notes: no flaky behavior observed across repeated runs during TDD cycling

## Manual Verification: CLI Exit Codes (spec Requirement 6)

`cli.test.ts` only unit-tests the pure `formatCliOutput()` formatting function — per design.md Decision 4, the CLI wrapper itself (`process.exit`, `console.error`) is intentionally not unit-tested directly. This left spec Requirement 6's two scenarios unverified until this step:

1. **Valid content → exit 0**: `npm run validate:content` against the real `/content` directory. Result: exit code 0, no output. ✅
2. **Invalid content → exit 1**: Temporarily removed the `name` field from `content/profile.yaml`, ran `npm run validate:content`. Result: exit code 1, printed `profile.yaml: name: Invalid input: expected string, received undefined`. ✅ Restored the original file from a backup immediately after; `git diff content/profile.yaml` confirmed a clean, fully-restored state.

## Implementation-Time Findings (surfaced only at manual-run step)

Two real environment-specific bugs were found only when running the CLI via raw `node`, not via Vitest's test transform (which had been silently smoothing over both):

1. Node's native TypeScript execution requires explicit `.ts` extensions on relative import specifiers (`./validate` failed with `ERR_MODULE_NOT_FOUND`; `./validate.ts` resolved correctly). Fixed in `cli.ts` and `validate.ts`; required adding `allowImportingTsExtensions: true` to `tsconfig.json`.
2. `package.json` needed `"type": "module"` to avoid a `MODULE_TYPELESS_PACKAGE_JSON` reparse warning/overhead — and once added, raw Node ESM has no `__dirname` (a CommonJS-only global that Vitest's transform had been shimming). Fixed by switching `validate.ts` to `import.meta.dirname` (native since Node 20.11).

Both fixes are recorded in design.md's Implementation Notes (task 8.3).

## Database State Verification — Not Applicable

This story is entirely file-based. It does not touch any database — the project's only database is the unrelated visitor-analytics event store (Story 7.3, JOS-72), which this change does not create, read, or write.

## Manual Endpoint Testing with curl — Not Applicable

This story introduces zero HTTP endpoints — a validation library and a CLI script only. There is nothing to exercise with curl. (Tasks.md §6.1)

## E2E Testing with Playwright MCP — Not Applicable

This story introduces no UI and no user-facing workflow — it is a build-time validation gate consumed by future build tooling. There is no browser-testable surface. (Tasks.md §7.1)

## Outcome

- Step 5 status: PASS
- Blocking issues: none
