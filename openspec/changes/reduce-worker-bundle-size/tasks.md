## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/reduce-worker-bundle-size` from post-JOS-110 `main` (commit `66a34c9`)
- [x] 0.2 Verified: `git branch --show-current` → `feature/reduce-worker-bundle-size`. No merge-order prerequisite for this change ("Depends on nothing, unblocks everything" — proposal.md Impact)

## 1. Lever ① — exclude the traced-in duplicate index

- [x] 1.1 Baseline recorded: `rm -rf .open-next && npx opennextjs-cloudflare build && npx wrangler deploy --dry-run` → **3009.68 KiB gzip** (proposal.md's cited 3006.83 KiB, essentially unchanged — small drift from content added since the ticket was authored)
- [x] 1.2 Confirmed: `find .open-next/server-functions/default -iname "*.mjs" -o -iname "*.js" | xargs grep -l "rag/index.json"` → no matches. The raw file `server-functions/default/lib/rag/index.json` (3,514,573 bytes → 697,420 bytes gzip = 681 KiB, exactly matching proposal.md's figure) is present but genuinely unreferenced; the compiled chunk `lib_rag_index_json_[json]_cjs_1zm_sao._.js` is confirmed present separately
- [x] 1.3 Added `outputFileTracingExcludes: { "/api/chat": ["./lib/rag/index.json"] }` to `next.config.ts`, keyed to the one route that imports the index, excluding exactly this one file path
- [x] 1.4 **Verified against the real build pipeline (`opennextjs-cloudflare build` + `wrangler deploy --dry-run` — the same toolchain `wrangler deploy` itself uses; no separate remote CI available in this environment) and found a real, previously-unknown issue** — see design.md Decision 5. Full clean rebuild (`rm -rf .next .open-next`) confirmed the raw duplicate file is genuinely excluded from `server-functions/default` and its trace manifests, **but the actual `wrangler deploy --dry-run` gzip figure did not move** (3009.82 KiB, within noise of baseline). Root-caused: `wrangler` bundles from `.open-next/worker.js`'s own import graph (`handler.mjs`, an already-fully-bundled ~8.5 MB file) — the loose file lever ① excludes was never part of that bundled output to begin with. Investigating *what* was in `handler.mjs` instead surfaced a second, real, larger duplication: `lib/rag/generate.ts`'s mixed `import { EMBEDDING_MODEL, type IndexedChunk } from "./embed.ts"` pulls `embed.ts`'s entire build-time-only CLI script (OpenAI client construction, content chunker, `writeFileSync`, `process.exit(1)` — none of which ever runs in the Worker) into the runtime bundle, because a bundler can't tree-shake `main()` out of a module when it's referenced by module-scope code (the `if (import.meta.url === ...) main()` guard), even though it's never invoked. Fixed by sourcing `EMBEDDING_MODEL` from its true origin, `lib/rag/models.ts` (which `embed.ts` only re-exports from), and keeping `IndexedChunk` as a pure `import type` — severing the runtime edge into `embed.ts` entirely
- [x] 1.5 Rebuilt and re-measured after **both** fixes together (lever ① + the `generate.ts` import fix) — see the measurement recorded in task 1.6 below, superseding the ~2326 KiB figure proposal.md projected for lever ① alone, since that projection was based on the (incorrect, now-corrected) assumption that the loose-file exclusion was the actual mechanism reducing wrangler's measured size
- [x] 1.6 Smoke-tested against `npm run preview` (real Workers runtime, port 8788): landing page `200`; `GET /rag-index.json` → `200 application/json 3514452` bytes (matches the source file exactly, confirming the Assets binding serves it correctly); `POST /api/chat` with a real question ("What has Jose done with AI?") streamed back a correct, grounded answer citing the real Oracle RAG-chatbot and Envato AI-background-removal work — proving `loadIndex()`'s new `env.ASSETS.fetch()` path genuinely retrieves and correctly ranks real content end-to-end, not just that the build succeeds

### 1B. Pivot: move the index to Workers Static Assets (design.md Decision 6 — owner-approved after reviewing the Decision 5/6 findings)

- [x] 1.7 Removed `outputFileTracingExcludes` from `next.config.ts` — verified moot
- [x] 1.8 Added `lib/rag/publish-index.ts` (mirrors `lib/site-config/build.ts`'s existing style) copying `lib/rag/index.json` → `public/rag-index.json`; wired into `prebuild` in `package.json`
- [x] 1.9 Rewrote `retrieve.ts`'s `loadIndex()`: `getCloudflareContext({ async: true }).env.ASSETS.fetch(...)`, with a module-level `cachedIndex` so a Worker isolate fetches once. Throws a clear error (including the HTTP status) on a non-ok response rather than silently returning empty
- [x] 1.10 Added `public/rag-index.json` to `.gitignore`, alongside `lib/rag/index.json`'s existing entry
- [x] 1.11 Done — `specs/cloudflare-deployment-compat/spec.md`'s "RAG index is loaded" scenario amended to name the Assets-binding mechanism
- [x] 1.12 **Real, dramatic result** — clean rebuild (`rm -rf .next .open-next public/rag-index.json`, full `npm run build` + `opennextjs-cloudflare build`) then `wrangler deploy --dry-run`: **Total Upload gzip 2393.92 KiB**, down from the 3009.68 KiB baseline (task 1.1). **615.76 KiB reclaimed** — headroom against the 3072 KiB free-tier limit goes from ~62 KiB (97.97% full) to **678.08 KiB (77.94% full)**. Remarkably close to design.md's own ~615 KiB estimate for this lever, despite that estimate being written before the pivot from lever ①'s original (moot) approach
- [x] 1.13 Confirmed: `grep -c "profile-summary" handler.mjs` → **0** (was 1 after the generate.ts fix, 2 at baseline). `handler.mjs` itself: 8,481,621 → 5,896,616 bytes raw (−2,585,005 bytes, matching the compiled chunk's size almost exactly). `find .open-next/assets -iname "rag-index.json"` confirms it now ships as a static asset instead

## 2. Lever ② — remove `next/og` from the Worker

- [x] 2.1 **Chose approach B** (generate in `prebuild`), not A. Reasoning: A calls for a genuinely *designed*, art-directed static image — a subjective visual-design deliverable requiring image-design tooling this agent doesn't have access to in this environment, and the user hasn't asked for a new visual design, just the bundle fix. B achieves the same bundle-removal goal while preserving exact parity with today's already-shipped card (name + positioning, `getProfile()`-driven), which is the safer, correctly-scoped choice here. C remains the documented fallback, unused
- [x] 2.2 Built `lib/seo/generate-og-image.ts` entirely with `React.createElement` (no JSX) — verified this constraint is real by running the script directly first; confirmed it works. **Real, non-obvious import issue found along the way**: `next/og` (no extension) isn't in Next's `package.json` `exports` map, so it only resolves inside Next's own bundler — not under plain Node's ESM loader this script runs under. Fixed by importing `next/og.js` (the real underlying file) directly; documented inline
- [x] 2.3 Confirmed: generated PNG is exactly 1200×630 (verified via direct PNG-header parse, not just trusting the `size` option), `image/png` (verified via `file`), 53,394 bytes
- [x] 2.4 Removed `app/opengraph-image.tsx`. Confirmed no test file referenced it, and `next build`'s route table dropped from 11 routes to 10 (no more `/opengraph-image`)
- [x] 2.5 Updated `lib/seo/metadata.ts` — `ogImageUrl` now `${siteUrl}/og-image.png`
- [x] 2.6 Confirmed: the only `@vercel/og` string match left in `handler.mjs` is Next's own generic lazy-external-import machinery (`id==="next/dist/compiled/@vercel/og/index.node.js"` → resolves to a throwing stub) — the real library is gone. `handler.mjs`: 5,896,616 → 5,001,724 bytes raw (−894,892 bytes)
- [x] 2.7 Re-measured (clean rebuild): **Total Upload gzip 1520.08 KiB**, down from 2393.92 KiB after lever ① alone — **873.84 KiB more reclaimed**, well beyond the original ~374 KiB estimate (that estimate was based on the old file-tree-breakdown methodology counting `@vercel/og` node *and* edge variants as separate loose-file contributors; the real bundled artifact only ever contained one, but removing the route also eliminated other now-unreachable code paths around it). **Combined total from baseline: 3009.68 → 1520.08 KiB, 1489.6 KiB reclaimed, headroom now 1551.92 KiB (49.5% of the 3072 KiB limit used, down from 97.97%)**

## 3. Verify the share card actually works (design.md Risk 2 — the real risk in this change)

- [x] 3.1 Against `npm run preview` (port 8789, real Workers runtime): `curl -sI http://localhost:8789/og-image.png` → `200`, `Content-Type: image/png`, `CF-Cache-Status: HIT` (served from the Assets cache, not generated). Downloaded and parsed the actual bytes: `1200 x 630, 8-bit/color RGBA` — real dimensions, not just trusting headers
- [x] 3.2 Viewed the actual served image directly: clean, correctly composed card — name + positioning, dark background, centered, fully legible, the ñ in "Muñoz" renders correctly (no font/encoding issue)
- [x] 3.3 `curl -s http://localhost:8789/ | grep 'og:image'` → `<meta property="og:image" content=".../og-image.png"/>` — resolves to the exact static file that is actually served, confirmed by 3.1
- [x] 3.4 **Partially achievable**: no public URL exists to test against a real third-party unfurl/share-link debugger from this sandboxed environment (this is a local `npm run preview` instance, not a deployed URL). Structural verification (3.1-3.3: correct status, content-type, real dimensions, correct meta resolution, visually confirmed legible) together constitute strong evidence the card works; a true third-party unfurl check is deferred to the owner's own post-deploy verification, consistent with this class of limitation in prior stories' reports

## 4. Review and Update Existing Unit Tests (MANDATORY)

- [x] 4.1 No existing test was actually coupled to the literal `/opengraph-image` URL (checked before editing). Added a new test asserting `ogImageUrl` resolves to `${siteUrl}/og-image.png` in both `openGraph.images` and `twitter.images`, so the new behavior is now locked in rather than just informally correct
- [x] 4.2 Confirmed no test file existed for `app/opengraph-image.tsx` (nothing to update/delete). `app/sitemap.test.ts`/`app/robots.test.ts` never referenced the route — both still pass unmodified
- [x] 4.3 Confirmed — every change here added a new assertion (metadata URL test, plus new `retrieve.test.ts`/`generate-og-image.test.ts` coverage for the two rewritten mechanisms); nothing was loosened or removed. Also added `lib/seo/generate-og-image.test.ts` (new — tests `generateOgImage()` produces a real, correctly-sized PNG from real profile content, matching `lib/site-config/build.test.ts`'s existing convention of testing the core logic function against real content). Skipped a dedicated test for `lib/rag/publish-index.ts`: unlike `build.ts`/`embed.ts`/`generate-og-image.ts`, it has no logic function to test — it is a single `copyFileSync` call with no data-shaping to verify

## 5. Run Unit Tests and Verify State (MANDATORY)

- [x] 5.1 Ran targeted tests for every changed module throughout implementation (per task group), not only at the end
- [x] 5.2 Full suite: `npx vitest run` — **91 files / 467 tests passed**, clean, no flake
- [x] 5.3 `npx tsc --noEmit` — clean
- [x] 5.4 `npm run validate:content` — clean
- [x] 5.5 `npm run lint` — same pre-existing repo-wide `eslint.config.js` gap as prior stories; skipped with the same rationale
- [x] 5.6 Database state verification: **N/A** — no backend/database in this repo. Rationale recorded in the report
- [x] 5.7 Report created: `openspec/changes/reduce-worker-bundle-size/reports/2026-08-14-step-5-unit-test-and-state-verification.md`

## 6. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 6.1 `curl -sI` against `npm run preview` (port 8789): landing page `200`; `/og-image.png` → `200 image/png`; `/rag-index.json` → `200 application/json`; `POST /api/chat` → real, correctly-grounded streaming answers (tested with two different questions), confirming neither lever broke the one consumer of the index
- [x] 6.2 Recorded — see `reports/2026-08-14-step-7-preview-verification.md`

## 7. Browser / Preview Verification (MANDATORY - AGENT MUST EXECUTE)

- [x] 7.1 Ran `npm run preview` twice this session, each from a fully clean rebuild
- [x] 7.2 Verified landing page, `/api/chat`, the OpenGraph image, and the RAG index asset all work against the real Workers runtime (Wrangler + Miniflare)
- [x] 7.3 Report created: `reports/2026-08-14-step-7-preview-verification.md`, with the full before/after bundle table and curl evidence

## 8. Final measurement and documentation (MANDATORY)

- [x] 8.1 Recorded: **1520.08 KiB gzip, 49.5% of the 3072 KiB free-tier limit, 1551.92 KiB headroom** — in this file (task 1.12, 2.7), `reports/2026-08-14-step-7-preview-verification.md`, and `README.md`
- [x] 8.2 Updated `README.md`'s "Bundle size" section with the new measurement and an explicit note that the free tier is a deliberate 2026-08-13 owner decision, not an oversight
- [x] 8.3 Documented in README: int8+base64 quantization (~500 KiB) and 512 dimensions (~⅔ reduction) as unspent follow-ups. The third original lever (`ASSETS`-served index, ~615 KiB) is **no longer a follow-up — it's implemented** (this change's own lever ①, in its pivoted form); README reflects this as done, not deferred
- [x] 8.4 Checked: `narrow-performance-budget` (JOS-107) has **not** merged (`git log --all` has no matching commit; the accepted `performance-budget-compliance` spec has no Worker-size requirement yet). N/A for now — noted here so whoever applies JOS-107 next can confirm this change's 1520.08 KiB measurement satisfies whatever ceiling that requirement states

## 9. OpenSpec sync

- [ ] 9.1 After merge, sync `specs/cloudflare-deployment-compat/spec.md` into `openspec/specs/cloudflare-deployment-compat/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
