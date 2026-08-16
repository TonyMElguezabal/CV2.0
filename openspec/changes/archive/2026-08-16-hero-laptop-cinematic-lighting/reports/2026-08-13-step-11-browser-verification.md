# Step 11 Report - Browser/E2E Verification

- Date: 2026-08-13
- Change: hero-laptop-cinematic-lighting
- Agent: Claude Code (opsx:apply), via `mcp__claude-in-chrome` browser automation

## curl / Endpoint Testing

**N/A** — this change adds no endpoint and touches no API route. Only presentational components (`HeroLaptop.tsx`, `HeroShellStyles.ts`, `HeroFramer.tsx`, `Terminal.tsx`) were modified.

## Environment

- `npm run dev` (Next.js 16.2.11, Turbopack), served at `http://localhost:3000`
- Real Chrome, driven via `mcp__claude-in-chrome` MCP tools (not a headless simulator)

## Scenarios Executed and Outcomes

### 1. Initial load (1440×900)
Laptop renders closed, docked to the bottom-right corner, cropped by the viewport as designed. Rim light visible as a faint edge highlight along the closed lid's top-left. No screen spill (correct — spill is 0 at scroll progress 0). No console errors.

### 2. Full scroll sequence (0.3, 0.6, 1.0 progress)
Rim strongest near closed, fading as the lid opens. Keyboard detail and a diagonal specular highlight clearly visible mid-scroll. Deck spill and bezel bloom build in as the lid opens. Terminal fully legible and correctly colored at full scroll (see Regression 2 below).

### 3. Mobile (390×844)
No laptop layer rendered, no lighting, hero text centered and fully readable — confirmed both before and after the geometry re-tuning in Regression 3.

### 4. Reduced motion — NOT ACHIEVABLE
`prefers-reduced-motion` is read via `window.matchMedia` at component mount. Overriding it for a real navigation requires OS-level media emulation or CDP's `Emulation.setEmulatedMedia` / script-injection-before-load; neither is exposed by the browser automation tools available in this session (attempting to override `window.matchMedia` via `javascript_tool` after page load does not retroactively change what framer-motion's `useReducedMotion` hook already read at mount). **Covered instead by 15 passing unit tests** in `HeroLaptop.test.tsx` asserting the exact static open-pose value for every light layer under `prefers-reduced-motion: reduce`, using the identical `prefersReducedMotion ? constant : motionValue` mechanism already shipped and visually verified in the accepted JOS-90/JOS-92 changes for the laptop's geometry.

### 5. No-JS — NOT ACHIEVABLE
Same tooling limitation: no exposed way to disable JavaScript for a single navigation in this session. The extended `<noscript>` CSS override (5 additional rules forcing every light to its open-pose opacity, following the exact pattern the existing scene/lid/screen overrides already use) was reviewed by source inspection but not visually confirmed with JS disabled.

### 6. Console
No errors or warnings attributable to this change, checked via `read_console_messages` across the full session. One recurring "1 Issue" Next.js dev overlay was investigated and confirmed pre-existing/unrelated (see below).

### 7. Performance profiling — NOT ACHIEVABLE
No CPU/frame profiling capability (DevTools Performance panel) exposed by the browser automation tools in this session. **Static verification stands in its place**: every animated property across all 8 light layers is `opacity` and (for the specular sweep) `x`/`translateX` only, enforced by a unit test asserting `el.style.filter`, `el.style.boxShadow`, and `el.style.backgroundPosition` are all empty strings on every light element, and confirmed by source review of every `style={{...}}` object in `HeroLaptop.tsx`. No new `will-change`, no new scroll listener (verified in task 7.1).

## Regressions Found and Fixed During This Step

Real-browser verification is what this step exists for — it found three genuine bugs that no unit test (jsdom has no layout engine and no real CSS compilation step) could have caught.

### Regression 1: Hero copy collided with the pre-existing CareerTimeline sidebar

Step 5.3's off-axis hero copy anchor (`sm:pl-16`, ~64px from the left edge) was implemented without accounting for `CareerTimeline`'s own pre-existing fixed left rail (`md:fixed md:left-4`). Measured via `getBoundingClientRect()`: the rail's right edge sits at x=176px; the hero H1 started at x=64px — a 112px horizontal overlap, confirmed visually in a screenshot at 1440×900 (career-entry text rendering directly on top of "Jose Muñoz").

**Fix:** added `md:pl-56` to `heroWrapperClass`, scoped to `md:` specifically (matching the breakpoint where the rail itself goes fixed — below that it's in normal document flow and doesn't conflict). Re-verified visually: no overlap at 1440×900.

### Regression 2: Terminal accent color had zero effect

Step 4's `terminalClass` applied the sapphire accent via a Tailwind arbitrary-value class built with JS template-literal interpolation: `` text-[${heroLaptopAccentHex}] ``. `getComputedStyle(terminal).color` returned `rgb(237, 237, 237)` — the body's default foreground, not sapphire. Confirmed root cause by checking the compiled dev CSS chunk directly (`curl` on `/_next/static/chunks/app_globals_*.css`): zero occurrences of `4d82bd`. Tailwind's JIT scanner only sees literal, static text in source files; a class name assembled at runtime via string interpolation never appears as that literal text, so no CSS rule was ever generated for it. The className string was correct; it had no visual effect whatsoever.

**Fix:** applied `heroLaptopAccentHex` as an inline `style.color` on the terminal element instead — the same technique already used for every light in the rig, which sidesteps Tailwind's JIT entirely. Verified via `getComputedStyle` returning `rgb(77, 130, 189)` (= `#4d82bd`) after the fix. The regression test was corrected to check the actual rendered color rather than the className string content, which is what let this bug through undetected in Step 4.

### Regression 3: Terminal screen clipped entirely out of frame at 1280×800

Step 5's enlarged laptop (`sm:h-[420px] sm:w-[680px]`, corner-docked with `sm:-mr-20 sm:-mb-12`) was sized and positioned by reasoning about a 1440×900 viewport only. Measured via `getBoundingClientRect()` at 1280×800: the terminal screen's top edge sat at y=-160 (160px above the viewport, entirely off-screen) and its right edge at x=1336 (56px past the 1280px viewport width). Screenshotted confirmation: the screen bezel was visible but completely empty — no terminal text rendered anywhere in the visible viewport.

**Fix:** iteratively reduced the base/lid size to `sm:h-[300px] sm:w-[520px]` and the negative margin to `sm:-mr-4 sm:-mb-6`, re-measuring after each change until `fullyInFrame` was true at 1280×800. Then verified at the three other required widths:

| Viewport | Screen box (left/right/top/bottom, px) | In frame |
|---|---|---|
| 1280×800 | 770 / 1272 / 56 / 338 | ✅ |
| 1440×900 | 930 / 1432 / 156 / 438 | ✅ |
| 1920×1080 | 1410 / 1912 / 336 / 618 | ✅ |
| 2560×1440 | 2050 / 2552 / 340 / 622 | ✅ |

Visually confirmed at 2560×1440 with a zoomed screenshot: full terminal text legible, correctly sapphire-tinted, with the bezel bloom glow visible around it.

## Light ⑤ Distinguishability — Resolved

Task 7.2 (design.md Risk 2) was carried into this step for a definitive, evidence-based answer. Method: at scroll progress 0.6 (representative mid-open pose) and 1.0 (⑤'s own peak intensity), all four of light ⑤'s DOM elements had their `opacity` forced to `0` via injected `!important` inline styles, the region was screenshotted, then the original values were restored and the same region re-screenshotted.

**Result: both before/after comparisons produced visually identical screenshots at both scroll positions.** This confirmed a prior analytical estimate (a worked compositing calculation put wash-lit's peak contribution at only ≈12 sRGB levels above the unlit baseline once composited under the 80%-opacity scrim, against four other simultaneously-active, higher-contrast lights in the same region).

Per the delta spec's own explicit instruction ("if it is not [distinguishable], stop and amend the spec rather than shipping a dead layer"), light ⑤ was removed: 4 DOM elements, 2 `useTransform` intensities, 2 gradient constants, 2 marker classes, and 2 `<noscript>` CSS rules deleted from `HeroLaptop.tsx`/`HeroShellStyles.ts`. The delta spec's lighting requirement and its "Illumination responds to orientation" scenario, `proposal.md`'s light table, and `design.md`'s Decision 2 table (plus a new Decision 8) were all amended to match. The rig ships with four lights (rim, screen spill, contact shadow, specular sweep), not five.

## "1 Issue" Dev Overlay — Investigated, Unrelated

A red "1 Issue" badge appeared in every screenshot throughout this session. Clicked to inspect: Next.js's dev-mode console-error overlay reporting `eval() is not supported in this environment... React requires eval() in development mode for various debugging features... React will never use eval() in production mode.` Confirmed present on an entirely unrelated route (`/admin/login`, which renders none of this change's components), proving it is a pre-existing dev-server/CSP artifact, not caused by this change, and explicitly stated by the message itself to have no production impact.

## Test Suite Stability Note

The full suite was run several times during this session. `ChatWidget.test.tsx > returns focus to the trigger after the panel closes` (a `waitFor`-based focus-timing assertion, in a file this change does not touch) failed intermittently — including once in isolation during this step's final check — but passed 3/3 on immediate reruns in isolation immediately after. This is the signature of a genuine timing flake, not a deterministic regression; it is not connected to any file this change modifies.

## Outcome

- Step 11 status: **PASS**, with two portions (reduced-motion and no-JS live verification, and frame profiling) explicitly not achievable with the browser automation tools available in this session — each has a documented rationale and a substitute verification path above, consistent with this codebase's established pattern for tooling limitations already present before this change.
- Three real regressions found via real-browser verification, all fixed and re-verified: a hero-copy/timeline-sidebar collision, a Tailwind-JIT color bug with zero visual effect, and a viewport-width-dependent terminal-clipping bug.
- One design question (light ⑤'s distinguishability) resolved with direct empirical evidence rather than assumption, resulting in its removal and a corresponding spec amendment.
