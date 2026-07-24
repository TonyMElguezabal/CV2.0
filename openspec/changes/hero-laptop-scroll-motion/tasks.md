## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-90-dynamic-laptop-on-the-hero-section` (Linear-provided branch name for JOS-90) from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Terminal content (content-first)

- [x] 1.1 Add a terminal-lines field (e.g. `hero.terminalLines` or a small `terminal` block) to the profile/hero Zod schema in `lib/content/schemas.ts`
- [x] 1.2 Author the terminal copy in `/content` and expose it via `lib/content/read.ts`
- [x] 1.3 Add/extend a failing content test asserting the terminal field is parsed and validated; run `npm run validate:content` and confirm it passes

## 2. HeroLaptop component (TDD)

- [x] 2.1 Write failing `components/HeroLaptop.test.tsx` (jsdom): initial state renders closed + lower-left/tilted pose as a background layer with the text still present
- [x] 2.2 Add tests for the transform bindings under default motion (lid `rotateX` / body reorientation present) and for the terminal being rendered at the fully-open end state
- [x] 2.3 Implement `components/HeroLaptop.tsx` (`"use client"`) using CSS 3D transforms (`perspective`, `transform-style: preserve-3d`, lid `rotateX`, body `rotateY`/`rotateZ`) driven by `useScroll()` bound to the whole document → `useTransform`, inside the existing `LazyMotion` (`MotionProvider`) boundary
- [x] 2.4 (Optional) Extract `components/Terminal.tsx` (+ test) rendering the content-sourced terminal lines
- [x] 2.5 Add the laptop/scrim styles to `components/HeroShellStyles.ts`

## 3. Reduced-motion, no-JS, and legibility states

- [x] 3.1 Add a test asserting that under `prefers-reduced-motion: reduce` the laptop is static, fully open, front-facing, terminal visible, with no scroll-linked transforms (mirror the `HeroFramer.test.tsx` fake-matchMedia pattern)
- [x] 3.2 Implement the reduced-motion branch (`useReducedMotion() === true`) rendering the static open state
- [x] 3.3 Add the no-JS static state via SSR default + a `<noscript>` override (mirror `HeroFramer.tsx`); confirm text stays readable
- [x] 3.4 Implement the legibility scrim between the laptop layer and page content

## 4. Page integration and mobile simplification

- [x] 4.1 Mount the fixed laptop layer behind `<main>` (in `app/page.tsx` or `app/layout.tsx`), passing the terminal content through
- [x] 4.2 Reconcile `components/HeroFramer.tsx` with the new layer (keep the existing name/positioning entrance + scroll-out); update `components/HeroFramer.test.tsx` as needed
- [x] 4.3 Add a test/behaviour for the simplified mobile presentation (breakpoint-gated) and implement it
- [x] 4.4 Confirm `components/accessibilityStructure.test.tsx` still passes (heading order intact; laptop/terminal `aria-hidden` and non-focusable)

## 5. Full verification

- [x] 5.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 5.2 Run `npx tsc --noEmit` clean
- [x] 5.3 Run `npm run validate:content` clean
- [x] 5.4 Run `npm run lint` (note the pre-existing repo-wide ESLint config failure; skip with the same rationale as prior stories)
- [x] 5.5 Run `npm run build` and re-capture the landing route's First Load JS; confirm it stays ≤ ~160 KB gzip and record any change in `README.md`
- [x] 5.6 Owner gate (documented-clause fallback if a full run isn't achievable headless): 60fps profiling of the laptop scroll animation (transform/opacity only), Lighthouse ≥90, and a contrast check on text overlapping the laptop; confirm the hero `h1` remains the LCP element

## 6. OpenSpec sync

- [ ] 6.1 After merge, sync `specs/hero-signature-motion/spec.md` into `openspec/specs/hero-signature-motion/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
