## Context

The repository has no UI, no browser-rendered surface, and no framework beyond the content-model tooling from Stories 1.1/1.2/1.3a (TypeScript, Vitest, Zod, yaml, gray-matter — all Node-only). PRD v1.1 §8 names Next.js (App Router) and Tailwind CSS as the site's stack. Per explicit user decision, this spike scaffolds that real stack now rather than a disposable harness, since a genuine hero prototype needs somewhere real to live, and PRD §11 bundles "stack decisions" into the same Phase 0 milestone as the motion spike.

Empirical checks performed before writing this design (not assumed):
- `create-next-app` cannot target this repo root directly — it derives the npm package name from the directory basename, and `CV2.0` contains uppercase letters, which npm naming rules reject. Scaffolding into a temp directory and merging in was necessary.
- The generated scaffold includes its own `CLAUDE.md`/`AGENTS.md` (Next.js's `--agents-md` default) — these must be explicitly excluded from anything copied over, since this repo already has real ones.
- The generated `app/layout.tsx` uses `next/font/google` (Geist), which fetches from Google Fonts at build time — a new external network dependency during build/deploy this project hasn't needed before.
- Google Chrome.app exists at the standard macOS path, and the Lighthouse CLI (`npx lighthouse`) runs — a real Lighthouse audit against a locally-served production build is viable, not just aspirational.

## Goals / Non-Goals

**Goals:**
- Merge a real Next.js App Router + Tailwind scaffold into the existing repo root without disturbing existing content-model tooling, tests, or real project files (`CLAUDE.md`, `AGENTS.md`, etc.).
- Build the same signature hero sequence twice — once with GSAP ScrollTrigger, once with Framer Motion — against real content, so the choice is evidence-based.
- Measure both against PRD §9's performance budget as far as this environment genuinely allows, and report honestly, including any measurement gap.
- Select one library, document why, and leave the codebase with only the winner's dependency.

**Non-Goals:**
- Story 2.2's full hero content acceptance criteria (all CTAs, no-JS fallback, exact copy).
- Story 2.3's full signature-animation acceptance criteria (reduced-motion alternative, final polish).
- Any other page, route, or the future chat API route.
- Deciding Vercel deployment configuration — out of scope until a deployment story exists.

## Decisions

### 1. Scaffold via `create-next-app` into a temp directory, then merge selectively into the repo root
Run `create-next-app` targeting a temp path (its own package-naming rules block targeting this repo root directly, confirmed above), then copy in only: `app/`, `next.config.ts`, `postcss.config.mjs`, `public/` (minus unused default SVGs), and `.gitignore` additions (`.next/`, etc.). Explicitly **excluded** from the copy: the generated `CLAUDE.md`, `AGENTS.md`, `README.md` (this repo's real ones must not be overwritten), and its `package.json`/`tsconfig.json` (merged by hand instead — see Decisions 2–3).
**Alternative considered**: hand-construct the App Router scaffold without `create-next-app` at all. Rejected — `create-next-app`'s output reflects the current, correct set of Next.js conventions (config shape, App Router file layout) more reliably than reproducing them from memory; the selective-copy step still gives full control over what actually lands in the repo.

### 2. Merge `package.json` by hand: keep existing identity and scripts, add framework dependencies
Keep `name: "careerdna"`, `version`, `description`, and the existing `test`/`validate:content` scripts. Add Next.js's `dev`/`build`/`start`/`lint` scripts alongside them. Add `next`, `react`, `react-dom` as dependencies; add `tailwindcss`, `@tailwindcss/postcss`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next` as devDependencies, alongside the existing `zod`/`yaml`/`gray-matter`/`typescript`/`vitest`/`@types/node`.
**Risk carried into this decision**: the existing `package.json` has `"type": "module"` (added in Story 1.2 so `lib/content/cli.ts` runs via raw Node ESM). Whether Next.js's build tooling is fully happy with `"type": "module"` at the package root is not something to assume — verified empirically during implementation (§ Risks below), not decided here in the abstract.

### 3. Merge `tsconfig.json`: base on Next's generated shape, fold in this project's extra strictness
Next.js's tooling expects to manage specific fields (`plugins: [{"name": "next"}]`, `paths`, an `include` list covering `.next/types/**/*.ts` and `next-env.d.ts`). Base the merged config on Next's generated version, add `dom`/`dom.iterable` to `lib` alongside the existing `ES2022`, keep this project's extra rigor (`noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`, `allowImportingTsExtensions` — needed for Story 1.2's CLI script), and expand `include` to cover both `app/**/*.tsx` and the existing `lib/**/*.ts`. Keep an explicit `types` array — **corrected during implementation, see Implementation Notes**: the original plan to drop it entirely was wrong.
**Alternative considered**: keep the two tsconfigs entirely separate (one for `lib/`, one for `app/`) via TS project references. Rejected — adds real complexity (multi-project builds, cross-references) for a "one repo, one deployment" project (PRD §8) that doesn't need it yet.

### 4. Avoid `next/font/google`; use a system font stack for the prototype
The generated scaffold's default `layout.tsx` fetches Geist from Google Fonts at build time — a new external network dependency this project hasn't needed for anything else (all prior work, including the earlier backlog/spec review artifacts, deliberately used system font stacks to avoid exactly this). Use a system font stack instead for this spike; the real typography decision belongs to whichever story actually designs the hero's final look (likely 2.2), not this comparison spike.

### 5. Fair comparison: same markup and content, two branches of one component, bundle-size + DX + smoothness compared side by side
Build a single hero component shell (real name/positioning from `content/profile.yaml`, loaded via the existing `lib/content` reading pattern) with two implementations of the same signature sequence — a fade/reveal-based entrance synchronized with scroll — one wired with GSAP ScrollTrigger, one with Framer Motion. Compare: production bundle size contribution (via `next build`'s per-route First Load JS output), implementation complexity/lines of code for the same visual result, and animation smoothness (manual browser verification, per Decision 6). Keep only the winning implementation and its dependency in the final tree; the losing library's code and dependency are removed once the decision is recorded, not left as dead code.
**Alternative considered**: choose based on library popularity/documentation alone, without building both. Rejected — the story's own acceptance criteria require the decision to come from a working prototype, not a desk review.

### 6. Performance measurement: real Lighthouse audit against a production build, with a documented fallback
Run `next build` (production build) and `next start` (production server) locally, then run the Lighthouse CLI (`npx lighthouse`) against it, using the system's Chrome.app (confirmed present) as the browser. Record actual Lighthouse performance/SEO/best-practices scores and LCP. If headless Chrome launch fails in this sandboxed execution environment (a real, not yet confirmed, risk — agent sandboxes commonly restrict browser process spawning), fall back to `next build`'s own reported First Load JS bundle size per route as a documented, honest proxy, and state plainly in the spike report which measurement was actually achieved. Also use browser automation (Chrome DevTools-based tooling) to visually confirm the animation runs and appears smooth — this is the first story introducing a browser-rendered UI, so the repo's mandatory browser-verification step genuinely applies here (unlike Stories 1.1/1.2/1.3a, where it was correctly marked not applicable).
**Alternative considered**: skip real measurement and just assert "should be performant." Rejected — the story's own acceptance criteria require the performance impact to be recorded, not assumed.

## Risks / Trade-offs

- **[Risk]** `"type": "module"` in `package.json` (needed by Story 1.2's CLI script) may not play cleanly with Next.js's build tooling. → **Mitigation**: verified empirically during implementation by actually running `next dev`/`next build`; if it breaks, the fallback is converting `lib/content/cli.ts`'s invocation to an explicit `.mjs`-aware script path rather than relying on package-level `"type": "module"` — resolved with a documented outcome, not assumed away.
- **[Risk]** Headless Chrome/Lighthouse may not launch in this sandboxed agent environment even though the binary and CLI are present. → **Mitigation**: bundle-size analysis from `next build`'s own output is a real, documented fallback — the spike report will state plainly which measurement was actually achieved.
- **[Risk]** Building two full animation implementations to compare is more work than a typical spike. → **Mitigation**: both use the same minimal hero shell and the same single signature sequence — not two full heroes — keeping the comparison bounded.
- **[Risk]** Introducing Next.js's own `CLAUDE.md`/`AGENTS.md`/`README.md` generation could silently clobber this project's real ones if the merge isn't careful. → **Mitigation**: those three files are explicitly excluded from the copy step (Decision 1); the merge is file-by-file, not a directory overwrite.

## Implementation Notes (post-hoc)

Decision 3's original plan — drop the explicit `types` array and let TypeScript auto-include everything from `node_modules` — was wrong, caught immediately by the regression gate (tasks.md §3.3). `vitest/globals` is not an `@types/*` package; it's an ambient declaration bundled inside the `vitest` package itself (`node_modules/vitest/globals.d.ts`, exposed via its own `exports` map), so it was never part of TypeScript's automatic `@types/*` inclusion — it only worked in Stories 1.1/1.2 because it was explicitly listed in `types`. Removing that array broke `describe`/`it`/`expect` resolution across all three existing test files.

First fix attempt (a standalone `vitest-globals.d.ts` with a `/// <reference types="vitest/globals" />` triple-slash directive, the standard community pattern for this exact situation) did not work in this environment — the file was confirmed included in the compiled program (`tsc --listFiles`), but the `declare global` augmentation still wasn't visible to unrelated files, a discrepancy not fully root-caused (possibly a TypeScript 7 behavioral difference from the TS 5.x this pattern is usually documented against). Reverted to the proven-working mechanism instead: an explicit `types: ["node", "react", "react-dom", "vitest/globals"]` array.

That fix then appeared to still fail identically — a second, unrelated issue: `incremental: true` (added for faster rebuilds) had written a stale `tsconfig.tsbuildinfo` cache during the broken intermediate state, and `tsc` was reusing its cached (wrong) diagnostics instead of re-checking. Removed `incremental: true` entirely — for a project this size, a full type-check already completes in well under a second, so the caching benefit doesn't outweigh the real risk of exactly this kind of stale-cache confusion recurring for a future developer. `*.tsbuildinfo` remains gitignored regardless. (Note: Next.js's own build process auto-re-adds `incremental: true` to `tsconfig.json` on `next build`/`next dev` — it manages that specific field itself as part of its TypeScript integration, so this setting is effectively Next-owned going forward, not something to keep fighting.)

### `next build` root cause: TypeScript 7 incompatibility, not `"type": "module"`

Design.md's originally-flagged risk (`"type": "module"` breaking Next's build tooling) turned out to be a red herring. `npm run build` failed with a cryptic, stack-trace-free error — `The "id" argument must be of type string. Received undefined` — immediately after the "Compiled successfully" phase, with no indication of which file or setting was responsible.

Systematic bisection (documented here since it took real effort and the wrong turns are worth recording): confirmed a pristine `create-next-app` scaffold builds fine in isolation → confirmed the failure reproduces with this project's exact `package.json` even in a fresh, uncontaminated directory → ruled out, one at a time, in a clean environment each time: `"type": "module"`, the `name` field, the uppercase repository directory name (`CV2.0` — npm's own naming rules block `create-next-app` from targeting it directly, but that's unrelated to this build failure), `zod`/`yaml`/`gray-matter`/`vitest` as dependencies, and the `@types/node` version. The actual cause: **this project pinned `typescript@7.0.2`, while a fresh `create-next-app` scaffold's `^5` range resolves to `5.9.3`** — Next.js 16.2.10's internal TypeScript integration is not compatible with TypeScript 7. Confirmed directly: downgrading to `typescript@^5` (pinned to `5.9.3`, matching the known-working control) took the build past the crash to the expected, sensible state.

**Fix applied**: pinned `typescript` to `5.9.3` for the whole project (Stories 1.1/1.2/1.3a's `lib/content` code is unaffected — TS5 is a strict subset of what TS7 accepted, and none of that code used anything TS7-specific). Confirmed the full existing regression suite (`tsc --noEmit`, `npm test`, `npm run validate:content`) still passes after the downgrade, and `next build` now completes successfully.

Two side-findings from the same investigation, fixed in passing since they were real, separate bugs surfaced along the way:
- `next.config.ts`'s `eslint: { ignoreDuringBuilds: true }` (added while trying to rule out ESLint as a suspect) is not a supported option in Next.js 16.2.10 — that config moved elsewhere. Reverted to the default empty config; ESLint is simply not run as part of this spike's verification (no `npm run lint` gate exists in tasks.md).
- The default scaffold's `page.tsx` references `/next.svg` and `/vercel.svg` via `next/image`, both of which were deleted in task 1.2 as "unused" — a real latent bug (an image-optimization failure waiting to happen) that never surfaced only because `page.tsx` was already being replaced with a placeholder before this was investigated.

## Migration Plan

Additive: merges a new stack into the existing repo without removing or breaking the content-model tooling from Stories 1.1/1.2/1.3a. `npm test` and `npm run validate:content` must continue to pass unchanged throughout — the regression gate for this change.

## Open Questions

None carried forward — the scaffold-merge strategy, comparison methodology, and measurement approach (with its fallback) are all resolved by the decisions above. The two empirical risks (module type, headless Chrome) are flagged, not silently assumed, and will be resolved with a documented real outcome during implementation.
