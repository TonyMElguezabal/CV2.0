## Why

PRD §9 sets the "craft" performance budget: Lighthouse ≥90 (performance/SEO/best-practices), LCP < 2.5s desktop / < 4s mid-range mobile, animation at 60fps, and a total JS budget with the motion library loaded lazily below the fold. The site is already static-first (a strong baseline), but `framer-motion` — the single heaviest client dependency — is imported **eagerly** in both animated surfaces (`HeroFramer`, `ChatWidget`), nothing is code-split, and there is no measurement gate. This is story 8.1 of the Epic 8 quality gate (JOS-74), the "hard gate" per PRD §12.

## What Changes

- **Lazy-load the motion library (AC3):** adopt `framer-motion`'s `LazyMotion` + `m` component pattern, loading the animation feature bundle via dynamic import instead of eagerly pulling the full `motion` API into the critical bundle — the library's own recommended bundle-size optimization, which makes "the motion library loads lazily" literally true.
- **Code-split the below-the-fold interactive surface (AC3):** keep the persistent chat **trigger** promptly available (required by `chat-widget-entry-point`), but lazy-load the heavy chat **panel** (its `AnimatePresence`/motion + `streamChat` path) behind a dynamic import so it — and its motion cost — is not in the initial page bundle.
- **Enforce a JS budget (AC3):** measure First Load JS from `next build`, record the baseline and a ceiling in the docs, and treat a regression past the ceiling as a review-blocking change.
- **Lighthouse + LCP gate (AC1, AC2):** document a repeatable `lighthouse` run as the owner-executed gate for the ≥90 scores and the LCP targets (desktop/mobile), mirroring the repo's existing manual-gate convention (`eval:chat`, Upstash). `@lhci/cli` in CI is noted as a future upgrade, not required for MVP.
- **60fps verification (AC4):** keep all animation on compositor-only properties (transform/opacity — already the case) and verify via a DevTools profiling pass; the hero's 60fps is already spec-owned, this generalizes the guarantee site-wide.
- **Out of scope:** removing `framer-motion` from the hero (its signature sequence is an accepted decision — `motion-library-decision` / `hero-signature-motion`); SEO (8.3), a11y (8.2), CSP (8.4). This story budgets and defers motion; it does not restyle or re-choose it.

## Capabilities

### New Capabilities
- `performance-budget-compliance`: the site-wide performance budget — the motion library is lazily loaded and kept out of the critical bundle, the initial JS budget is enforced, the landing page meets the Lighthouse ≥90 and LCP targets, and animations sustain 60fps.

### Modified Capabilities
_None._ Lazy-loading and budgeting are cross-cutting quality guarantees layered over existing features — the hero still plays its signature sequence (`hero-signature-motion`, which keeps its own 60fps requirement) and the chat widget still exposes its persistent trigger and opens (`chat-widget-entry-point`). No feature requirement changes.

## Impact

- **Modified files:** `components/HeroFramer.tsx` + `components/ChatWidget.tsx` (`motion`/`AnimatePresence` → `m`/`AnimatePresence` under a `LazyMotion` provider with dynamically-imported features); a shared `components/MotionProvider.tsx` (client) wrapping surfaces in `LazyMotion`; `app/layout.tsx` (dynamic-import the chat panel / lazy boundary); their test files (keep `hero-signature-motion`'s synchronous entrance-state assertions green under `LazyMotion` — see design).
- **New files:** `components/MotionProvider.tsx`; docs — a "Performance budget" note (`README.md`) recording the measured First Load JS baseline/ceiling and the Lighthouse/LCP gate procedure.
- **No new dependencies** (`framer-motion` and `next/dynamic` already available), no new env vars, no endpoints, no content/schema changes.
- **Cross-story dependencies:** the Lighthouse **SEO** sub-score of AC1 depends on 8.3 (`seo-metadata-and-structured-data`) being merged — the final ≥90 gate should run after 8.3 lands; the performance and best-practices sub-scores are independent and can be worked now. Motion stays compatible with 8.4's CSP (`style-src 'unsafe-inline'` covers framer-motion whether eager or lazy).
