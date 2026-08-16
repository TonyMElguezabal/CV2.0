## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/narrow-performance-budget` from `main`
- [x] 0.2 Verified: `git branch --show-current` → `feature/narrow-performance-budget`

**Note on this change's shape:** this is a **spec-and-docs-only** change. It
removes four requirements, adds one, and reverts no implementation. There is no
application code to write, so the usual TDD sections do not apply — the
verification here is that the spec is internally consistent and that the
project's recorded numbers are accurate.

## 1. Measure and record the real Worker size (AC: "The deployed Worker bundle stays within the platform's size limit")

- [x] 1.1 **Found the proposal's own numbers are stale before implementing anything.** Ran `npx opennextjs-cloudflare build` + `npx wrangler deploy --dry-run` fresh (2026-08-15): **1520.08 KiB gzip**, not the 3006.83 KiB recorded in proposal.md/design.md (2026-08-13). Root cause: `JOS-106` (`reduce-worker-bundle-size`) merged in the interim and already fixed the exact near-exhaustion this proposal describes. Corrected proposal.md and design.md in place (Context + Decision 5 amendments) with the real number and an explicit account of what changed and why, per CLAUDE.md §7 — before touching any documentation task below, since 3.1-3.3 would otherwise have shipped stale figures into README/PRD
- [x] 1.2 Free tier 3072 KiB → **1551.92 KiB headroom, 49.48%(rounds to 49.5% in README) consumed** — a completely different situation from the 65.17 KiB / 97.9% this proposal was written against. Already correctly recorded in `README.md`'s "Cloudflare deployment" → "Bundle size" section (JOS-106's own Step 8 final measurement matches this exactly: 1520.08 KiB / 49.5% / 1551.92 KiB)
- [x] 1.3 Confirmed via README's own "Bundle size" note (plan tier is an account-level Cloudflare setting, not declared in `wrangler.jsonc`): the project is deliberately on Cloudflare's **free tier** (3072 KiB / 3 MiB gzip limit), an explicit 2026-08-13 owner decision recorded in README — not the 10 MiB paid plan. The requirement's "plan in use" framing (design.md Decision 4) resolves against this recorded fact
- [x] 1.4 **Stale claim corrected, not just copied.** The retrieval index no longer appears in the Worker bundle at all — JOS-106 moved it to the Workers Static Assets binding (`env.ASSETS`), which carries no comparable limit. There is no longer one dominant contributor the way the index was before; recorded in design.md Decision 5's amendment as a structural risk (any future change that imports build-time data directly into a Route Handler instead of routing it through Static Assets) rather than a specific named contributor, since there currently isn't one
- [x] 1.5 Confirmed via `openspec/specs/cloudflare-deployment-compat/spec.md`'s "No request-time filesystem reads of bundled application data" requirement and README's "Cloudflare deployment" section: `.open-next/assets/` (client JS, static assets) ships via the Workers Static Assets binding, uploaded and served separately from the Worker script — this is exactly why the removed First Load JS ceiling was the wrong instrument for the constraint that actually binds (per the spec's own removal migration note)

## 2. Update the capability's Purpose line (design.md — required at sync)

- [x] 2.1 Added a "New capability Purpose (apply verbatim at sync)" section to design.md with the current Purpose quoted for reference and the full rewritten replacement text — describes the narrowed capability (Worker size limit + 60fps compositor-only motion) and explicitly names the four removed client-delivery/search-discovery metrics with the reason they're gone
- [x] 2.2 Confirmed: the rewritten Purpose names exactly the two requirements that survive in the main spec after sync (the unmodified 60fps requirement, and the new Worker-size requirement added by this change's delta spec) — no contradiction

## 3. Update project documentation (MANDATORY)

- [x] 3.1 Rewrote README's "Performance budget" section intro blockquote: states plainly that the four requirements were removed outright (not just deprioritized in prose), and cross-references "Cloudflare deployment → Bundle size" as the section carrying the requirement that's actually spec-enforced now, plus the unchanged 60fps requirement. The Worker size measurement itself needed no rewrite — it already lived in a separate "Cloudflare deployment" → "Bundle size" subsection with the correct, current, prominent numbers (recorded by JOS-106 itself, matching task 1.1's fresh re-measurement exactly)
- [x] 3.2 **Superseded by the corrected reality** (task 1.1/1.2): headroom is no longer 65 KiB / effectively none — JOS-106 already fixed that to 1551.92 KiB / 49.5% consumed, and README's existing "Bundle size" subsection already states this accurately, including the free-tier decision context. No "urgent paid-plan" framing to add, since the situation it would have described no longer exists
- [x] 3.3 Updated `docs/PRD.md` §9's Performance bullet: replaced the flat Lighthouse/LCP/JS-budget claim with an explicit account of what's no longer spec-enforced (with the 2026-08-13 decision cited) versus what still is (60fps, Worker size limit) — no longer silently contradicts the narrowed spec
- [x] 3.4 Checked `AGENTS.md` (the `CLAUDE.md` symlink target, per CLAUDE.md §6) — no performance-budget references exist in it at all (`grep -in "performance\|lighthouse\|LCP\|First Load\|60fps"` returns nothing on `main`). Confirmed N/A, nothing to update

## 4. Consistency check against other capabilities

- [x] 4.1 Confirmed: `openspec/specs/hero-signature-motion/spec.md`'s "Signature sequence sustains 60fps" requirement cites "PRD §9's performance budget" — PRD §9's Performance bullet (updated in task 3.3) still explicitly keeps 60fps compositor-only motion as enforced, so this reference still resolves correctly, not orphaned
- [x] 4.2 Confirmed: `grep` for `performance-budget-compliance`/Lighthouse/LCP/First-Load-JS in `openspec/specs/seo-metadata-and-structured-data/spec.md` returns nothing — fully untouched and independent, exactly as the proposal claims
- [x] 4.3 Confirmed: `cloudflare-deployment-compat` references "the platform's hard size limit" twice, but only as *motivation* for its own unrelated requirements (why the RAG index and `next/og` were moved out) — it never itself asserts a "SHALL stay within X" size requirement. No duplication with this change's new Worker-size requirement, consistent with design.md Decision 3's own reasoning
- [x] 4.4 Grepped `site-typography-and-palette`'s proposal.md — it explicitly names this exact tension and forward-references this change: *"This deprioritization contradicts an accepted capability... reconciling them with the owner's distribution model is its own change, deliberately kept separate."* Once this change's spec sync lands, that forward reference resolves and the tension it names is gone — no edit needed there, it already describes its own reasoning accurately

## 5. Verification

- [x] 5.1 `openspec validate narrow-performance-budget --strict` → "Change 'narrow-performance-budget' is valid"
- [x] 5.2 `npx vitest run --no-file-parallelism` — first run showed one flaky failure in the untouched `ChatWidget.test.tsx` (same class of CPU-contention `waitFor` timing flake documented in prior tickets' Step 7 reports); a clean re-run passed **467/467**, confirming this change didn't cause it (this change touches no code at all)
- [x] 5.3 `npx tsc --noEmit` — clean. `npm run validate:content` — clean
- [x] 5.4 Confirmed via `git diff main --stat`: only `README.md`, `docs/PRD.md`, and `openspec/changes/narrow-performance-budget/*` changed — no `components/`, `lib/`, or `app/` files touched

## 6. OpenSpec sync

- [x] 6.1 After merge, sync `specs/performance-budget-compliance/spec.md` into `openspec/specs/performance-budget-compliance/` — verify the four REMOVED requirements are actually gone from the main spec, the new size requirement is present, and the Purpose reflects the rewrite from task 2.1
- [x] 6.2 Archive this change (per CLAUDE.md §10 / `opsx:archive`)
