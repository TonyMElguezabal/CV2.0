## Context

The hero today is `components/HeroFramer.tsx` (`"use client"`), wrapped in `MotionProvider` (`LazyMotion domAnimation`, fetched at idle so it stays out of the LCP-critical chain). It uses `useScroll({ target: wrapperRef, offset: ["start start", "end start"] })` → `useTransform` to fade/translate the hero wrapper as it scrolls out, plus a staggered `initial`/`animate` entrance on the name/positioning text, with a `useReducedMotion` branch and a `<noscript>` override that guarantees readable text without JS. That behavior is the accepted `hero-signature-motion` capability.

JOS-90 broadens that capability: the signature element becomes a MacBook that spans the **whole document** as a persistent background, opening and reorienting from a closed lower-left/tilted pose to fully-open front-facing as the visitor scrolls top→bottom, revealing a terminal at the end. All product decisions are resolved on the ticket (whole-page scroll range; initial lower-left/tilted pose; reorient to front-facing; background layer with a legibility scrim; simplified on mobile; terminal text is content).

Binding constraints from accepted specs: `performance-budget-compliance` (motion library lazy/out of the critical bundle; First Load JS ≤ ~160 KB gzip, baseline ~128 KB; transform/opacity only; 60fps; LCP text unaffected) and `accessibility-compliance` (contrast, reduced-motion, no-JS, heading order). CSP allows `img-src 'self' data:` only — no external asset host.

## Goals / Non-Goals

**Goals:**
- Make the laptop the site's signature sequence, driven by full-document scroll, with a readable terminal at the bottom.
- Preserve the accepted reduced-motion, no-JS, 60fps, and text-legibility guarantees under the new visual.
- Add zero new heavy dependencies and keep the initial bundle within budget.
- Keep the terminal copy in `/content` (content-first).

**Non-Goals:**
- Wiring the terminal to the real chatbot / "Ask AI" (a separate story).
- Changing analytics, chat, content-rendering, SEO, or CSP capabilities.
- A photoreal 3D model or physics; adding résumé/contact CTAs.

## Decisions

### 1. CSS 3D transforms, not a 3D engine
Render the laptop as styled elements (divs/SVG) in a 3D scene (`perspective` on the container, `transform-style: preserve-3d`, lid as a panel rotated on a hinge via `rotateX`, body reoriented via `rotateY`/`rotateZ`). **Alternatives considered:** Three.js/React-Three-Fiber (rejected — tens of KB gzip would blow the ~160 KB First Load ceiling and pull a WebGL runtime into the critical path); Lottie/Rive (rejected — extra runtime + JSON asset weight, and the animation must be *scroll-scrubbed*, not time-based); an image/video sprite sequence (rejected — heavy asset bytes, risks becoming the LCP element, and less crisp). CSS 3D is compositor-friendly (transform/opacity only), satisfies the 60fps requirement by construction, and adds no dependency.

### 2. A page-level fixed layer, not a hero-contained element
Because the open maps to **whole-document** scroll, the laptop cannot live inside the hero wrapper (which fades out over the first viewport). It becomes a separate `position: fixed`, full-viewport background layer mounted once (in `app/page.tsx` or `app/layout.tsx`, behind `<main>`), driven by `useScroll()` bound to the **document** (no `target` → progress 0→1 across the full page). `useTransform` maps progress → lid `rotateX` and body reorientation, with the terminal reveal mapped near progress ≈ 1. The existing hero text entrance and scroll-out stay as-is in `HeroFramer.tsx`. **Alternative:** a `sticky` element inside a tall track (rejected — a fixed layer is simpler for a persistent whole-page background and avoids restructuring every section into one track).

### 3. Legibility scrim between laptop and content
A dimming overlay sits between the fixed laptop layer and the page content (e.g. a semi-opaque layer, or the laptop rendered at reduced contrast) so text over it always meets `accessibility-compliance` contrast. The scrim is part of the laptop layer, not per-section. **Alternative:** per-section backgrounds (rejected — duplicative and fragile).

### 4. Reduced-motion / no-JS = static open + terminal
Under `useReducedMotion() === true` (or SSR/no-JS), skip the scroll bindings and render the laptop static, fully open, front-facing, terminal visible — mirroring the existing `HeroFramer.tsx` reduced-motion branch and `<noscript>` override pattern. This keeps the useful end-state visible while honoring the preference and keeping text readable without JS.

### 5. Mobile simplification via a breakpoint
On small viewports, gate the full-page fixed 3D motif off in favor of a reduced/static presentation (e.g. a smaller static open laptop, or hero-scoped only). Keeps the effect from overwhelming a tall mobile scroll and protects LCP/readability. Exact breakpoint set at implementation from the existing Tailwind scale.

### 6. Terminal text is content
Add a field (e.g. `hero.terminalLines` / a small `terminal` block) to `lib/content/schemas.ts` (Zod), authored in `/content`, read via `lib/content/read.ts`, threaded to the laptop component. Validated by `npm run validate:content`. Keeps copy out of components per the content-first principle.

### 7. Decorative for assistive tech
The laptop and terminal are decorative: `aria-hidden`, not focusable, no effect on heading order (the `h1` name stays the first heading, protected by `accessibilityStructure.test.tsx`). No accessible-text equivalent is required because the terminal carries no information not already on the page; if the authored copy later becomes meaningful, revisit.

## Risks / Trade-offs

- **[Risk] A big fixed background becomes the LCP element and hurts LCP.** → Keep the hero `h1` text as the LCP candidate; render the laptop with CSS/SVG (no large raster) and behind the text; re-measure LCP in the perf gate.
- **[Risk] Scroll-scrubbed 3D transforms jank on low-end devices.** → transform/opacity only, `will-change` used sparingly, profile for 60fps (documented-gate clause if a full headless profile isn't achievable); mobile runs the simplified path.
- **[Risk] Contrast regressions where text overlaps the laptop.** → the scrim (Decision 3) plus a contrast check in the a11y gate.
- **[Trade-off] A fixed whole-page background is unusual and could distract from content.** → the scrim keeps it subdued; reduced-motion/mobile fall back to static. Accepted as the deliberate "signature" per PRD F1.
- **[Risk] `useScroll` document binding differs from the hero-target binding and isn't exercised in jsdom.** → unit tests assert rendered states (initial/reduced/no-JS/static) and the presence of the transform bindings; the scroll *scrubbing* is verified in the manual 60fps/visual gate, consistent with how `hero-signature-motion` already models a measurement clause.

## Migration Plan

Branch `joseelguezabal/jos-90-dynamic-laptop-on-the-hero-section` → add the terminal content field + schema (`validate:content` green) → build `HeroLaptop` (+ optional `Terminal`) with the document-scroll bindings, reduced-motion/no-JS static states, scrim, and mobile simplification → mount the fixed layer behind `<main>` → reconcile `HeroFramer`/tests → `npm test` / `tsc` / `validate:content` clean → `next build` to re-capture First Load JS (≤ ~160 KB gzip) and confirm the laptop isn't the LCP element → manual 60fps profiling + Lighthouse ≥90 + contrast check (owner gate, documented-clause fallback) → sync the delta into `openspec/specs/hero-signature-motion/` and archive. Rollback = revert the layer mount + component; the delta spec supersedes the prior `hero-signature-motion` requirements only on archive.

## Open Questions

- None blocking — all four product decisions (scroll range, initial pose, reorientation end-state, mobile) are resolved on the ticket. The mobile breakpoint and exact terminal copy are set at implementation time and are not architectural.
