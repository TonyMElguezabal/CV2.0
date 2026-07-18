## Context

Story 1.1 (`content-file-structure`, merged as PR #1, not yet on `main`) established `/content` and hand-written TypeScript interfaces in `lib/content/types.ts` (`Profile`, `Experience`, `Project`, `Skill`), each proven only against one example fixture. This story adds the general-purpose validator PRD v1.1 §6 calls for: a build-time check that scans *every* file under `/content` — not just the examples — and fails loudly on missing required fields, dangling `skills.yaml` evidence references, or malformed dates.

No Next.js app or build pipeline exists yet (a separate Phase 0 stack decision). This story's own scope ends at producing a standalone, testable validation function plus a thin CLI entry point — wiring it into a real build step is explicitly deferred.

## Goals / Non-Goals

**Goals:**
- Validate every file under `/content` (not just examples) against the shapes already defined by Story 1.1.
- Detect and report, per PRD's three named failure classes: missing required fields, dangling skill→evidence references, malformed dates.
- Fail with a clear, per-file, per-field error list; exit non-zero. Pass silently (exit 0) when everything is valid.
- Keep `lib/content/types.ts`'s public shape (`Profile`, `Experience`, `Project`, `Skill`) unchanged in meaning — this story validates that existing contract, it does not redesign it.

**Non-Goals:**
- Authoring more content (Stories 1.3a/1.3b/1.3c).
- Deciding or wiring the real Next.js build pipeline's validation hook — out of scope until that stack decision exists.
- Deep narrative-quality checks on Markdown bodies (e.g., "does the project body actually discuss problem/approach/outcome") — Story 1.1's fixture-level test already covers that pattern; this story's three named failure classes don't require re-checking it generally.
- Validating `faq.md`'s structure beyond existence — none of the three named failure classes (missing field, dangling reference, malformed date) meaningfully apply to loose FAQ Markdown.

## Decisions

### 1. Adopt Zod as the schema/validation layer, and derive `types.ts` from it
PRD v1.1 §6 names "Zod or JSON Schema" explicitly. Define schemas in a new `lib/content/schemas.ts`, then mechanically refactor `types.ts` so each exported type becomes `export type X = z.infer<typeof XSchema>` instead of a hand-written `interface`. This is a behavior-preserving, minimal, mechanical edit to Story 1.1's file — the shapes stay byte-for-byte identical from a consumer's perspective (same field names, same optionality), only their *source of truth* moves from a hand-written interface to a single schema that also does runtime validation. Avoids two independent, driftable definitions of the same shape.
**Alternative considered**: hand-roll validation functions (`typeof x === 'string'` checks per field), no new dependency. Rejected — this would mean writing and maintaining a small, ad hoc validation library by hand when a well-tested, zero-dependency-tree library that PRD already names does the same job better, with clearer per-field error messages.

### 2. Date format: `YYYY-MM` or `YYYY-MM-DD`, validated as a real calendar date
Story 1.1's own `experience/acme-corp.yaml` fixture uses `"2021-03"` (year-month), not a full ISO date — common for résumé-style date ranges. Zod's built-in `.date()` string check requires full `YYYY-MM-DD` and would reject that fixture. Define a shared `dateStringSchema` (a `z.string().refine(...)`) accepting either format and confirming it parses to a real calendar date (rejecting e.g. `"2021-13"` or `"2021-02-30"`), reused across `ExperienceDates.start`/`.end`.
**Alternative considered**: require full ISO dates. Rejected — would force a Story 1.1 fixture rewrite for no requirement-driven reason.

### 3. Validation logic lives in `lib/content/validate.ts`, colocated with `types.ts`/`schemas.ts`
Consistent with Story 1.1's convention (`lib/content/` = code that knows about content). Exports a pure function `validateContent(contentRoot?: string): ValidationResult` where `ValidationResult = { valid: boolean; errors: ValidationError[] }` and `ValidationError = { file: string; field?: string; message: string }`. `contentRoot` defaults to the real `/content` directory but accepts an override, so tests can point the validator at temporary fixture directories containing deliberately broken content — without ever writing invalid data into the real `/content` tree. Pure and synchronous — no `process.exit` inside it — so it's directly unit-testable without process-mocking.
**Alternative considered**: a separate top-level `lib/validation/` module. Rejected — this validator is entirely specific to the content model; a generic-sounding sibling directory would overstate its scope.

### 4. Thin CLI entry point, run via Node's native TypeScript support
Add `lib/content/cli.ts`: calls `validateContent()`, prints each error as `file: field: message` (or `file: message` when `field` is absent), and calls `process.exit(result.valid ? 0 : 1)`. Wire an npm script `"validate:content": "node lib/content/cli.ts"`. Confirmed Node 26 (this project's runtime) executes `.ts` files natively via built-in type-stripping — no `tsx`/`ts-node` dependency needed, keeping the scaffold minimal per Story 1.1's own precedent.
**Alternative considered**: add `tsx` as a devDependency for running the script. Rejected once native execution was confirmed working — an unnecessary dependency.
The CLI wrapper itself (`process.exit`, `console.error` formatting) is intentionally thin and not unit-tested directly; `validateContent()` — the actual logic — is fully covered by tests.

### 5. Collect all errors, don't fail fast
`validateContent()` scans the entire `/content` tree and accumulates every issue found (missing fields across every file, every dangling reference, every malformed date) into one `errors` array, rather than stopping at the first failure. This matches how a real build-time gate should behave — a content author fixing one problem shouldn't have to re-run the build repeatedly to discover the next one.

### 6. Dangling-reference detection reuses Story 1.1's ID convention, computed fresh (not hardcoded)
`validateContent()` reads the actual filenames under `content/experience/` and `content/projects/` at validation time to build the set of known slugs (same approach Story 1.1's own tests already use), then checks every `skills.yaml` entry's `evidence` array against that set. This means the validator scales automatically as 1.3a/1.3b/1.3c add real chapters — no hardcoded slug list to maintain.

## Risks / Trade-offs

- **[Risk]** Refactoring `types.ts` (owned by the already-merged Story 1.1) touches a file outside this story's own new code. → **Mitigation**: the edit is mechanical and behavior-preserving (interface → `z.infer` type alias, identical field shape); Story 1.1's own tests (`content.test.ts`) continue to import from `types.ts` unchanged and must keep passing as a regression check.
- **[Risk]** Native Node TypeScript execution has known limitations (e.g., enums with runtime values, certain non-erasable syntax). → **Mitigation**: `types.ts`/`schemas.ts`/`validate.ts`/`cli.ts` are restricted to fully-erasable TypeScript (interfaces, type aliases, no enums), which is already this project's style; if a future story needs non-erasable syntax, that story can introduce `tsx` then.
- **[Risk]** The custom date-format validator could accept a technically-invalid-looking edge case (e.g., very old or future years) since it only checks calendar validity, not a business-reasonable range. → **Mitigation**: acceptable for MVP scope; PRD's requirement is "malformed date" detection, not range validation.

## Migration Plan

N/A — additive change; no existing validation exists to migrate from or deprecate.

## Implementation Notes (post-hoc)

Two real environment-specific issues surfaced only at the manual-run step (tasks.md §3.5), not from Vitest's test suite — Vitest's transform pipeline was silently smoothing over both:

- **Explicit `.ts` extensions required.** Node's native TypeScript execution needs relative import specifiers to carry their real extension (`./validate.ts`, not `./validate`) — `.tsc` throws `ERR_MODULE_NOT_FOUND` otherwise. Fixed in `cli.ts` and `validate.ts`, plus added `allowImportingTsExtensions: true` to `tsconfig.json` (TypeScript otherwise rejects `.ts`-suffixed imports by default).
- **No `__dirname` in ESM.** Adding `"type": "module"` to `package.json` (needed to stop a `MODULE_TYPELESS_PACKAGE_JSON` reparse warning) makes raw Node treat all `.ts`/`.js` files as true ESM, where the CommonJS-only `__dirname` global doesn't exist. Vitest's transform had been providing it regardless. Fixed by switching `validate.ts` to `import.meta.dirname` (native since Node 20.11, confirmed working on this project's Node 26 runtime).

Decision 4's core claim — Node 26 runs `.ts` files natively with no `tsx`/`ts-node` dependency — held up; these were resolution/global-scope details the original single-file probe didn't exercise, not architecture changes. No other divergence from the six decisions above.

## Open Questions

- Where this validator plugs into a real build pipeline (a Next.js `prebuild` hook, a CI step, or both) — deferred to the Phase 0 stack-decision story, same as Story 1.1's equivalent open question.
