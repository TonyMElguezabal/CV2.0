## Context

The site is static-first SSG (Next 16 App Router) — a strong performance baseline: the below-the-fold sections (chapters, skills, projects, contact, footer) are static server components with no client JS, and the hero renders final-state content from SSR HTML (so LCP text paints without waiting on JS). The gap is the motion library: `framer-motion` is imported **eagerly** with the full `motion`/`AnimatePresence` API in the only two animated surfaces (`HeroFramer` above the fold, `ChatWidget` fixed/below-the-fold), nothing is code-split (`next/dynamic` unused), and there is no measurement gate. `hero-signature-motion` already owns the hero's 60fps requirement and models a pragmatic measurement-gate scenario ("…or the report documents why a full profiling run was not achievable").

## Goals / Non-Goals

**Goals:**
- Keep `framer-motion` out of the critical initial bundle (lazy features + code-split the heavy chat panel), enforcing the JS budget (AC3).
- Meet Lighthouse ≥90 (perf/SEO/best-practices) and the LCP targets (AC1, AC2) via a documented, repeatable gate.
- Guarantee 60fps by keeping animation compositor-only (AC4).

**Non-Goals:**
- Removing `framer-motion` from the hero — its signature sequence is an accepted architectural decision (`motion-library-decision`, `hero-signature-motion`).
- SEO (8.3), a11y (8.2), CSP (8.4).
- A CI performance gate (`@lhci/cli`) — noted as a future upgrade, not MVP.

## Decisions

### 1. `LazyMotion` + `m`, features loaded via dynamic import
Replace `import { motion } from "framer-motion"` (the eager full API) with the `m` component under a `LazyMotion` provider whose `features` are loaded lazily: `features={() => import("framer-motion").then((mod) => mod.domAnimation)}`. `m` is a tiny core; the `domAnimation` feature bundle (the smaller of the two, sufficient for the hero's transform/opacity + the widget's enter/exit) loads after initial render. This is framer-motion's official bundle-size optimization and is exactly "the motion library loads lazily." Introduce a shared `components/MotionProvider.tsx` (`"use client"`) so both surfaces wrap consistently.
- *Alternative considered:* eager `domMax`/full `motion`. Rejected — that's the current eager cost this story removes.

### 2. Code-split the heavy chat panel; keep the trigger prompt
`chat-widget-entry-point` requires a persistent trigger on every section, so the lightweight trigger stays eagerly rendered. The heavy part — the `AnimatePresence` panel, `streamChat`, citations UI — is loaded via `next/dynamic` on first open (or after idle), so `framer-motion` + the chat panel are absent from the initial page bundle. This is the single biggest below-the-fold JS win and directly serves AC3 ("below-the-fold content… motion library loads lazily").
- *Constraint:* the trigger must not regress `chat-widget-entry-point`'s "persistent entry point" or `streamed-chat-answers` behavior — the split is internal; open/stream/close behavior is unchanged.

### 3. JS budget is measured from `next build` and recorded
`next build` prints per-route **First Load JS**. Capture the landing route's number as the baseline, record it and a ceiling in `README.md`, and treat a future change that pushes past the ceiling as review-blocking. No bespoke tooling; the build output is the budget instrument. (`npm run build` runs the `prebuild` embed step and needs `OPENAI_API_KEY` — already configured locally.)

### 4. Lighthouse ≥90 + LCP as a documented owner gate
Run `npx lighthouse <url> --preset=desktop` and a mobile run against a production build (`next build` + `next start`), asserting performance/SEO/best-practices ≥ 90 and LCP < 2.5s desktop / < 4s mid-range mobile. Document the procedure and thresholds in `README.md` as the owner-executed gate — the same manual convention as `eval:chat`/Upstash (things a headless `npm test` can't measure). `@lhci/cli` in CI is a noted future upgrade.
- *Dependency:* the **SEO** sub-score depends on 8.3 (`seo-metadata-and-structured-data`); run the final ≥90 gate after 8.3 merges. Performance/best-practices are independent and workable now.

### 5. 60fps via compositor-only animation (AC4)
The hero (opacity + `y` transform) and the chat panel (opacity + `y`) already animate only compositor-friendly properties — no layout-triggering animation. Keep it that way and verify with a DevTools Performance profiling pass. The hero's 60fps stays owned by `hero-signature-motion`; this capability asserts the site-wide guarantee with the same pragmatic "document if a full profiling run isn't achievable in the environment" clause.

### 6. Keep the motion tests green under LazyMotion
`HeroFramer`'s tests assert entrance-state transform values (e.g. `24px`) synchronously. Under `LazyMotion`, features load asynchronously, so `m.*` may render its initial static state before features hydrate — which could break those synchronous assertions. Mitigation: wrap each surface in its `MotionProvider`/`LazyMotion` so it works standalone, and in the test environment load the features synchronously (import `domAnimation` directly in tests, or `await` feature hydration before asserting) so `hero-signature-motion`'s behavior contract stays verified. This is called out so the refactor doesn't silently weaken those tests.

## Risks / Trade-offs

- **[Risk]** `LazyMotion`'s async feature load breaks the hero's synchronous transform tests. → **Mitigation:** Decision 6 — self-contained providers + synchronous feature loading in tests; keep `hero-signature-motion` green.
- **[Risk]** The Lighthouse SEO ≥90 sub-score fails if 8.3 isn't merged. → **Mitigation:** documented dependency (Decision 4); run the final gate after 8.3; work perf/best-practices independently.
- **[Risk]** Dynamic-importing the chat panel could delay first open or flash. → **Mitigation:** prefetch on idle/hover; the trigger stays eager so the entry point is immediate; open/stream/close behavior unchanged.
- **[Risk]** Lighthouse/LCP/60fps aren't reproducible in a headless agent environment. → **Mitigation:** same pragmatic clause `hero-signature-motion` already uses — record the measurement or document why a full run wasn't achievable; the owner runs the authoritative gate on real hardware.
- **[Trade-off]** Manual Lighthouse gate over CI enforcement. Accepted for MVP (matches repo convention); `@lhci/cli` is a clean future add.

## Migration Plan

Implement per `tasks.md` → `npm test` / `tsc` / `validate:content` clean (motion tests green under LazyMotion) → `next build` to capture First Load JS + confirm the chat panel is a separate chunk → `next start` + `npx lighthouse` (desktop + mobile) for the ≥90/LCP gate (final SEO sub-score after 8.3 merges) → DevTools profiling for 60fps → record baselines in README → merge. Rollback is a plain revert of the motion-provider/dynamic-import changes; behavior is unchanged, only bundling differs.

## Open Questions

- None blocking. Gate mechanism resolved (manual, Decision 4); the exact JS-budget ceiling is set from the measured baseline at implementation time; the SEO sub-score dependency on 8.3 is a sequencing note, not a blocker for building the lazy-motion work.
