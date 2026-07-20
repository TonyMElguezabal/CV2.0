## Why

JOS-55 (PRD §5 F1, §4.2, §9) requires the hero's signature animated sequence to have a full `prefers-reduced-motion` fade-only alternative. `components/HeroFramer.tsx` already implements the signature sequence (scroll-linked fade/parallax on the wrapper, staggered fade+slide entrance on the name and positioning text) from the 2.1 motion-library spike, and `hero-ctas` already guarantees no-JS readability of the hero text — but there is currently no `prefers-reduced-motion` detection anywhere in the codebase. A recruiter with reduced-motion enabled currently gets the full parallax/slide animation, which violates an explicit accessibility requirement and PRD principle §4.2 ("Reduced-motion preference fully respected").

## What Changes

- Add `prefers-reduced-motion` detection to `HeroFramer.tsx` (via Framer Motion's `useReducedMotion` hook).
- When reduced motion is preferred: disable the scroll-linked wrapper opacity/y parallax entirely (fixed, no scroll-driven motion), and replace the name/positioning entrance with an opacity-only fade (no y-offset slide).
- When reduced motion is not preferred: retain the existing signature sequence unchanged.
- Verify the existing no-JS `<noscript>` override still guarantees full readability in both motion modes (it forces final state regardless of branch, so no code change expected there — verification only).
- Measure and record the animation's frame rate against the PRD §9 60fps budget, using Chrome DevTools performance profiling, with a documented fallback (as `motion-library-decision`'s pattern) if a full profiling run isn't achievable in this environment.

## Capabilities

### New Capabilities
- `hero-signature-motion`: the production behavior contract for the hero's signature animated sequence — default motion mode, reduced-motion fade-only mode, no-JS readability, and the 60fps performance requirement. (Neither `hero-ctas`, which covers CTA content/no-JS text readability, nor `motion-library-decision`, which covers the now-concluded library-selection spike, currently specify this runtime behavior.)

### Modified Capabilities
(none)

## Impact

- `components/HeroFramer.tsx` (add reduced-motion branch)
- New test file `components/HeroFramer.test.tsx` (jsdom, mocking `prefers-reduced-motion` media query)
- No schema, content, or backend changes
- No new dependencies — `useReducedMotion` ships in the already-installed `framer-motion` package
