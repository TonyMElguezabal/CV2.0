## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-92-laptop-animation-improvement` (Linear-provided branch name for JOS-92) from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Fix the closed-on-load pose (AC1)

- [x] 1.1 In `components/HeroLaptop.tsx`, retune `CLOSED_LID_ROTATE_X` so the lid renders flush against the base (a genuinely shut clamshell, no visible gap) at scroll progress 0; leave `OPEN_LID_ROTATE_X` and the reorientation constants unchanged
- [x] 1.2 Update `components/HeroLaptop.test.tsx`'s coupled assertions (the `-100deg` closed-lid literal and the "not fully open" checks) to the new closed-angle value; keep the reduced-motion / no-JS / mobile assertions green
- [x] 1.3 Run `npx vitest run components/HeroLaptop.test.tsx` and confirm it passes

## 2. Add laptop-defining detail via CSS primitives (AC2, AC3, AC4)

- [x] 2.1 Add a keyboard to the base — a CSS-grid (or flex rows) of small key elements on the base's top face — as a static child inside the base in `HeroLaptop.tsx`, styled via new classes in `components/HeroShellStyles.ts`
- [x] 2.2 Add a trackpad — a rounded rectangle centered below the keyboard
- [x] 2.3 Add a screen bezel (inner border framing the terminal) and a hinge line where the lid meets the base
- [x] 2.4 Replace the flat `bg-zinc-800` on base/lid with a subtle gradient/shading (paint-only, not animated)
- [x] 2.5 Add presence assertions to `HeroLaptop.test.tsx` for the keyboard and trackpad (e.g. `data-testid` or role/class checks)

## 3. Closed-pose lid accent (AC5)

- [x] 3.1 Add a subtle accent (e.g. a small centered mark) on the lid's outward-facing top so the closed clamshell reads as a laptop; style in `HeroShellStyles.ts`
- [x] 3.2 Confirm the accent is present in the DOM (test) and does not affect the reduced-motion/no-JS static-open assertions

## 4. Confirm all JOS-90 behavior is preserved (AC6)

- [x] 4.1 Confirm the scroll open/reorient, terminal reveal, `prefers-reduced-motion` static-open, no-JS `<noscript>` static state, scrim, and `hidden sm:flex` mobile gating are unchanged — all existing `HeroLaptop.test.tsx` and `accessibilityStructure.test.tsx` assertions for these stay green
- [x] 4.2 Confirm the laptop layer is still `aria-hidden` and adds no semantic content / no heading-order change

## 5. Full verification

- [x] 5.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 5.2 Run `npx tsc --noEmit` clean
- [x] 5.3 Run `npm run validate:content` clean
- [x] 5.4 Run `npm run lint` (note the pre-existing repo-wide ESLint config failure; skip with the same rationale as prior stories)
- [x] 5.5 Run `npm run build` and confirm it still succeeds; confirm no First Load JS change (no new deps/assets) and the CSP is untouched
- [x] 5.6 Real browser check (the look-and-feel is the point): on load the laptop reads as genuinely closed (not slightly open); scrolling opens it to a recognizable laptop with keyboard/trackpad/bezel/hinge; the closed-pose lid accent is visible; text over the laptop stays legible (scrim intact); reduced-motion renders the static open laptop; mobile still hides the laptop below `sm`. Capture before/after screenshots for the owner visual sign-off (AC4)

## 6. OpenSpec sync

- [ ] 6.1 After merge, sync `specs/hero-signature-motion/spec.md` into `openspec/specs/hero-signature-motion/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
