## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/reduce-worker-bundle-size` from post-JOS-110 `main` (commit `66a34c9`)
- [x] 0.2 Verified: `git branch --show-current` → `feature/reduce-worker-bundle-size`. No merge-order prerequisite for this change ("Depends on nothing, unblocks everything" — proposal.md Impact)

## 1. Lever ① — exclude the traced-in duplicate index

- [ ] 1.1 Record the **baseline** before changing anything: `npx opennextjs-cloudflare build && npx wrangler deploy --dry-run`, capture the gzipped upload size (measured 2026-08-13: 3006.83 KiB)
- [ ] 1.2 Re-confirm the duplicate is unreferenced on the current tree — grep every shipped `.mjs`/`.js` in `.open-next/server-functions/default` for `rag/index.json`; the compiled chunk (`lib_rag_index_json_…_cjs_….js`) is the copy that must survive
- [ ] 1.3 Add `outputFileTracingExcludes` to `next.config.ts` excluding exactly `lib/rag/index.json` — one specific path, not a glob over `lib/` (design.md Risk 3)
- [ ] 1.4 **Verify the duplication and the fix reproduce on the real deploy path**, not just locally — the entire premise of this lever is a claim about OpenNext's file tracing, and a different build environment could trace differently (design.md Decision 1 / Risk 1). If the deploy runs through a Cloudflare pipeline rather than a local build, confirm there
- [ ] 1.5 Rebuild and re-measure; record the delta (expected ~−681 KiB gz → ~2326 KiB)
- [ ] 1.6 Smoke-test `/api/chat` against `npm run preview` — it is the one route that actually reads the index, so an over-broad exclusion surfaces here and nowhere else

## 2. Lever ② — remove `next/og` from the Worker

- [ ] 2.1 **Spike: choose between approach A and B** (design.md Decision 2). A = a designed static PNG in `public/`; B = generate it in the existing `prebuild` step. Decide on evidence, and record the choice and reasoning in this file before implementing. C (`serverExternalPackages`) is the documented fallback only if both A and B fail
- [ ] 2.2 If B: note that `prebuild` runs under `node --experimental-strip-types`, which strips types but does **not** transform JSX — the generator must build its element tree with `React.createElement`, not JSX, or the script will not parse
- [ ] 2.3 Produce the image at 1200×630 (matching the current route's declared `size`) as `image/png`
- [ ] 2.4 Remove `app/opengraph-image.tsx` so `next/og` leaves the app's import graph entirely
- [ ] 2.5 Update `lib/seo/metadata.ts` — `ogImageUrl` currently resolves to `${siteUrl}/opengraph-image`; point it at the static file's real URL
- [ ] 2.6 Rebuild and confirm the Worker bundle no longer contains `@vercel/og` — grep `.open-next/server-functions/` for `@vercel/og` and expect nothing
- [ ] 2.7 Re-measure; record the delta (expected ~−374 KiB gz beyond lever ①)

## 3. Verify the share card actually works (design.md Risk 2 — the real risk in this change)

- [ ] 3.1 Fetch the OpenGraph image URL against `npm run preview` and confirm HTTP 200, `content-type: image/png`, and 1200×630 dimensions
- [ ] 3.2 Confirm the rendered card is correct and legible — this is the site's first impression under direct-link sharing, so a blank or mis-sized image is worse than the bundle problem being solved
- [ ] 3.3 Confirm the page's `<meta property="og:image">` in the built HTML resolves to the image that is actually served (the modified requirement's third scenario)
- [ ] 3.4 Check a real link-preview render (paste the URL somewhere that unfurls, or use a share-link debugger) — the build passing proves nothing about whether the card appears

## 4. Review and Update Existing Unit Tests (MANDATORY)

- [ ] 4.1 Update `lib/seo/metadata` tests coupled to the `/opengraph-image` route URL
- [ ] 4.2 Check `app/opengraph-image`-related tests and `sitemap`/`robots` tests for references to the removed route
- [ ] 4.3 Confirm no test was weakened to pass

## 5. Run Unit Tests and Verify State (MANDATORY)

- [ ] 5.1 Run targeted tests for the changed modules
- [ ] 5.2 Run the full suite: `npx vitest run`
- [ ] 5.3 Run `npx tsc --noEmit` clean
- [ ] 5.4 Run `npm run validate:content` clean
- [ ] 5.5 Run `npm run lint` (pre-existing repo-wide ESLint config failure — no `eslint.config.js`; skip with the same rationale as prior stories)
- [ ] 5.6 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9). Record the rationale in the report
- [ ] 5.7 Create report `openspec/changes/reduce-worker-bundle-size/reports/YYYY-MM-DD-step-5-unit-test-and-state-verification.md`

## 6. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [ ] 6.1 **Applicable here, unlike recent changes** — `curl -I` the OpenGraph image URL and `/api/chat` against `npm run preview`, verifying status, content-type, and that chat still retrieves (proving the index exclusion did not break the one consumer)
- [ ] 6.2 Record the commands and responses in the Step 7 report

## 7. Browser / Preview Verification (MANDATORY - AGENT MUST EXECUTE)

- [ ] 7.1 Run `npm run preview` (`opennextjs-cloudflare build && opennextjs-cloudflare preview`) — this populates the static-assets cache automatically; a raw `wrangler dev` gives false-negative crashes for static routes (README)
- [ ] 7.2 Verify the landing page, `/api/chat`, and the OpenGraph image all work against the Workers runtime, not just `next dev`
- [ ] 7.3 Create report `openspec/changes/reduce-worker-bundle-size/reports/YYYY-MM-DD-step-7-preview-verification.md` with the before/after bundle measurements and the curl evidence

## 8. Final measurement and documentation (MANDATORY)

- [ ] 8.1 Record the final Worker size, the free-tier limit, and the resulting headroom — the whole point of the change, so it belongs in the record, not just the PR description
- [ ] 8.2 Update `README.md`'s Cloudflare deployment section with the new measurement, and note that the free tier is being retained deliberately (owner decision) rather than as an oversight
- [ ] 8.3 Document the unspent follow-up levers in the README so the next person facing this ceiling does not rediscover them: int8+base64 quantization (~500 KiB), 512 dimensions (~⅔ of the index), `ASSETS`-served index (~615 KiB)
- [ ] 8.4 If `narrow-performance-budget` has merged, confirm this change satisfies its new Worker-size requirement and that the recorded measurement is the one that requirement obliges the project to keep

## 9. OpenSpec sync

- [ ] 9.1 After merge, sync `specs/cloudflare-deployment-compat/spec.md` into `openspec/specs/cloudflare-deployment-compat/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
