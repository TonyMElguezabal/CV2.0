## Context

`HeroFramer.tsx` (from the 2.1 motion-library spike) implements two layers of motion: a scroll-linked wrapper fade/parallax (`useScroll` + `useTransform`, driving `opacity`/`y` via inline `style`) and a staggered entrance fade+slide on the name/positioning text (`initial`/`animate`/`transition` props). Neither layer currently checks `prefers-reduced-motion`. PRD §9 requires a full fade-only alternative under that preference, and §4.2 states the preference must be "fully respected" — not partially. The existing `<noscript>` override (added in `hero-content-and-ctas`) already forces the text to its final, fully-opaque state when JS is disabled, which independently satisfies the no-JS requirement regardless of motion mode, so this change only needs to add the reduced-motion branch for the JS-enabled path.

## Goals / Non-Goals

**Goals:**
- Detect `prefers-reduced-motion` at runtime and fully suppress the scroll-linked parallax/fade and the y-offset slide when it's set.
- Preserve a simple opacity-only fade for the name/positioning entrance under reduced motion (opacity crossfades are not considered motion-triggering under WCAG 2.3.3 / the PRD's "fade-only" language).
- Keep the existing default (non-reduced) sequence pixel-identical to today's behavior.
- Record a 60fps measurement (or a documented fallback) against PRD §9.

**Non-Goals:**
- No redesign of the signature sequence's default timing/easing.
- No changes to `HeroCtas.tsx` or hero text content — this change touches motion behavior only.
- No new "reduced motion" content variant beyond suppressing motion (text/CTAs are identical in both modes).

## Decisions

- **Use Framer Motion's `useReducedMotion()` hook**, not a hand-rolled `matchMedia` listener, since it's already part of the installed dependency, handles the media-query subscription/cleanup, and keeps the reduced-motion source of truth inside the same library driving the animation.
- **Call all motion hooks unconditionally; branch only on the values fed into `style`/`initial`/`animate`.** `useScroll`/`useTransform` are still called every render (Rules of Hooks), but when `prefersReducedMotion` is true, the wrapper's inline `style` uses constant `{ opacity: 1, y: 0 }` instead of the scroll-linked motion values, and the text `initial`/`animate` variants drop the `y` key entirely rather than setting it to a static 0 (avoids implying a suppressed-but-present slide). This avoids conditional-hook-call bugs while still guaranteeing zero visible parallax/slide.
- **Treat `useReducedMotion()`'s initial SSR/pre-mount `null` as "not reduced"** (i.e., only branch on `=== true`), matching the current SSR-rendered inline values (`opacity:0` initial, non-reduced wrapper values) so there's no incremental behavior change for the already-working default path; the hook resolves to a concrete boolean on mount before the entrance animation would otherwise start, so there's no visible flash of the wrong mode in practice.
- **Test via a mocked `window.matchMedia`** in a jsdom test file (`components/HeroFramer.test.tsx`), asserting rendered inline style/props differ correctly between the two `matchMedia` mock states, rather than asserting actual frame-by-frame animation (jsdom doesn't run a real compositor).
- **Measure 60fps via Chrome DevTools performance profiling** (manual, using the `claude-in-chrome` tools) against the dev server, following the same "record what's achievable, document the fallback if not" pattern `motion-library-decision` already established for this environment.

## Risks / Trade-offs

- [Risk] `useReducedMotion()` resolving after first paint could theoretically cause a one-frame flash of the wrong mode → Mitigation: the hook resolves in a `useEffect` before Framer Motion's `animate` transition begins (React commits the DOM, then effects run, then the browser paints the next frame where the animation starts), so in practice there is no user-visible flash; not adding a loading gate to avoid extra complexity for an effect that isn't observable.
- [Risk] jsdom-based tests can't truly verify 60fps or real compositor behavior → Mitigation: automated tests cover the branching logic (props/styles differ correctly by mode); the 60fps requirement is verified separately via manual DevTools profiling, documented in the task report.

## Open Questions

None outstanding — implementation approach is fully determined by the existing `HeroFramer.tsx` structure and Framer Motion's public API.
