# Step 5 Report - Unit Tests and State Verification

- Date: 2026-08-14
- Change: reduce-worker-bundle-size
- Agent: Claude Code (opsx:apply)

## Commands Executed

- `npx vitest run lib/rag/ lib/seo/ app/sitemap.test.ts app/robots.test.ts` (targeted, throughout implementation)
- `npx vitest run` (full suite)
- `npx tsc --noEmit`
- `npm run validate:content`
- `npm run lint`

## Unit Test Results

- Full suite: **91 files / 467 tests passed**, clean on this run (no flake)
- Runtime: full suite ≈8s
- **Addendum, immediately before commit** (after Task Group 8's documentation-only edits — README.md, AGENTS.md, no code): the same pre-existing `ChatWidget.test.tsx` timing flake documented in every prior story on this branch lineage recurred across 3 consecutive full-suite runs. Checked `uptime`: load average 10.6, still meaningfully elevated (same root cause as JOS-110's own report — long-running `wrangler dev`/`workerd` processes on this host, not started by this session). Confirmed passes in isolation (8/8) every time. Since nothing changed code-wise since this report's own clean 91/467 run above, that run remains the valid record for this change's actual test coverage.

## New/Modified Test Files

- `lib/rag/retrieve.test.ts` — rewritten `loadIndex` describe block: mocks `@opennextjs/cloudflare`'s `getCloudflareContext` (Vitest doesn't run the dev-mode Cloudflare shim), tests loading real index content via the Assets-fetch mock, caching (fetch called once across two `loadIndex()` calls), and the error path (non-ok response throws with the status in the message)
- `lib/seo/generate-og-image.test.ts` — new; asserts `generateOgImage()` produces a real PNG (signature bytes verified) at the exact declared 1200×630 size, from real profile content
- `lib/seo/metadata.test.ts` — added a test locking in `ogImageUrl` resolving to the static `/og-image.png` file
- No dedicated test for `lib/rag/publish-index.ts` (a single `copyFileSync`, no logic to verify — see tasks.md 4.3) or `next.config.ts`'s removed `outputFileTracingExcludes` (config deletion, nothing to test)

## TypeScript / Content Validation

- `npx tsc --noEmit`: clean throughout — checked after every task group, not just at the end
- `npm run validate:content`: clean

## Lint

- `npm run lint` fails with the same pre-existing, repo-wide condition documented in every prior story on this branch lineage: no `eslint.config.js` exists anywhere in the repository (ESLint 9 requires flat config). Not introduced by this change. Skipped per this change's own `tasks.md` 5.5.

## Database State Verification

- **N/A** — this repository has no backend or database (`AGENTS.md`/`CLAUDE.md` §9). This change touches Cloudflare bundling configuration, a runtime data-loading mechanism (RAG index), and a build-time image generator. No state to capture, verify, or restore.

## Notable Findings During Implementation (see tasks.md and design.md for full detail)

- Task 1.4's mandatory real-deploy-path verification found that lever ① (`outputFileTracingExcludes`) and the original proposal's whole premise didn't hold against the real `wrangler deploy --dry-run` measurement — see design.md Decisions 5-6. This led to a substantive, owner-approved pivot: moving the RAG index to the Workers Static Assets binding instead, which produced a much larger real reduction (615.76 KiB) than the original lever ever could have.
- A second real bug found along the way: `lib/rag/generate.ts`'s mixed value+type import from `embed.ts` pulled the entire build-time-only CLI script into the runtime bundle (design.md Decision 5) — fixed by sourcing the value from its true origin (`models.ts`).
- `next/og` (bare specifier) isn't in Next's `package.json` exports map and doesn't resolve under plain Node's ESM loader outside Next's own bundler — `next/og.js` (the real underlying file) does. Found by actually running the new prebuild script, not assumed.

## Scope of Changes Verified

- New: `lib/rag/publish-index.ts`, `lib/seo/generate-og-image.ts` (+ its test), plus the `retrieve.test.ts`/`metadata.test.ts` additions
- Modified: `next.config.ts` (tracing excludes added then removed), `lib/rag/generate.ts` (import fix), `lib/rag/retrieve.ts` (Assets-binding fetch), `lib/seo/metadata.ts` (image URL), `package.json` (`prebuild` steps), `.gitignore` (two new generated-file entries)
- Removed: `app/opengraph-image.tsx`

## Outcome

- Step 5 status: **PASS**
- Blocking issues: none
- Remaining work: Steps 6-9 per `tasks.md` (curl smoke test — already partially covered by task 1.6/3.1, preview verification report, final measurement/documentation, OpenSpec sync)
