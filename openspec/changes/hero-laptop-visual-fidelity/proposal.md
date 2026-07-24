## Why

The hero's signature background laptop (shipped by `hero-laptop-scroll-motion` / JOS-90) currently renders as two plain rounded rectangles — a base and a lid, both flat `bg-zinc-800`. It reads as an abstract box, not a laptop (JOS-92). Two concrete problems:

1. **It doesn't look like a laptop.** No keyboard, no trackpad, no screen bezel, no hinge detail — just a box that opens.
2. **The closed-on-load state is a bug against the existing spec.** The accepted `hero-signature-motion` capability already requires the laptop to render "closed (lid flat)" at load, but the implementation sets `CLOSED_LID_ROTATE_X = -100` (rotated ~10° past flat), which reads as "slightly open" and awkward — not the clean closed pose the spec promises.

This change raises the laptop's visual fidelity so it's recognizably a laptop, and fixes the closed-on-load geometry to actually match the accepted contract. All of JOS-90's motion behavior is preserved unchanged.

## What Changes

- **Fix the closed-on-load pose (bugfix).** Retune the lid's closed angle in `components/HeroLaptop.tsx` so at scroll progress 0 the laptop reads as genuinely closed — lid flush against the base, no visible gap — instead of the current slightly-open look. This aligns the implementation with the already-accepted "closed (lid flat)" requirement.
- **Add laptop-defining detail via CSS primitives.** On the base: a recognizable keyboard (a CSS-grid of small key elements) and a trackpad (rounded rectangle, centered below the keyboard). On the screen/lid: a bezel (inner border around the terminal) and a hinge line where lid meets base. Plus subtle material shading (gradient) instead of flat fill. All static child elements that ride the existing base/lid transforms — no new animated properties.
- **Add a subtle closed-pose lid accent.** Because a fully closed laptop is inherently a flat slab (the keyboard/trackpad only become visible as it opens), add a small centered accent on the lid's visible top face so the closed state still reads as a laptop rather than a blank rectangle.
- **No motion-behavior change.** The scroll-driven open + reorient, terminal reveal, `prefers-reduced-motion` static-open state, no-JS static state, the legibility scrim, the mobile `hidden sm:flex` simplification, and the 60fps transform/opacity-only guarantee all stay exactly as JOS-90 shipped them.
- **Out of scope:** any change to the scroll mapping, the terminal content, the reduced-motion/no-JS/mobile behaviors, or the introduction of image/SVG assets or a 3D library (JOS-90's "CSS 3D transforms, no dependencies, no assets" decision stands).

## Capabilities

### New Capabilities
_None._ This is a visual-fidelity refinement of the existing signature laptop, not a new capability.

### Modified Capabilities
- `hero-signature-motion`: tighten the "Initial state on load" scenario so "closed" is unambiguous (the current wording allowed the `-100°` misread that produced a slightly-open pose), and add a requirement that the laptop is visually recognizable as a laptop (screen/bezel, keyboard, trackpad, hinge, and a closed-pose lid accent). No change to any of the capability's motion, reduced-motion, no-JS, 60fps, scrim, or mobile requirements.

## Impact

- **Modified files:** `components/HeroLaptop.tsx` (retune the closed lid angle; add keyboard/trackpad/bezel/hinge/lid-accent child elements), `components/HeroShellStyles.ts` (new classes for those elements), `components/HeroLaptop.test.tsx` (its assertions are coupled to the exact transform literals `-100deg`/`-35deg`/`-8deg`, so the closed-angle change requires updating them; add presence assertions for keyboard + trackpad).
- **Unchanged (verified):** the scroll bindings, reduced-motion branch, `<noscript>` override, scrim, and mobile gating in `HeroLaptop.tsx`; the terminal content pipeline; every other accepted capability.
- **No new dependency, no new asset, no endpoint change, no schema change.** Static CSS children ride existing transforms, so First Load JS, the CSP, and the 60fps/transform-only budget are all untouched. The laptop stays `aria-hidden` decorative.
