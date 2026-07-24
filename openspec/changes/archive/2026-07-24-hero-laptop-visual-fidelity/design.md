## Context

The signature background laptop shipped by `hero-laptop-scroll-motion` (JOS-90) is, structurally, two `<m.div>` rectangles inside a 3D scene (`components/HeroLaptop.tsx`): a base (`heroLaptopBaseClass` — a flat `h-40 w-64 rounded-b-lg bg-zinc-800` slab) and a lid (`heroLaptopLidClass`, hinged at its bottom edge via `origin-bottom`, containing the terminal screen). A `useScroll()`→`useTransform()` chain drives the lid's `rotateX` (closed→open over the first 85% of document scroll) and the scene's `rotateY`/`rotateZ` (angled→front-facing over the full scroll). It reads as an abstract box.

JOS-92 asks for two things, resolved with the owner:
1. **Make it look like a laptop** — add a keyboard, a trackpad ("mouse pad"), and enough detail (bezel, hinge, shading, a closed-pose lid accent) that it's recognizable.
2. **Fix the closed-on-load pose** — it currently looks "slightly open," which is a bug: the accepted `hero-signature-motion` spec already requires "closed (lid flat)" at load, but `CLOSED_LID_ROTATE_X = -100` (≈10° past flat-back) doesn't achieve a clean closed clamshell.

## Goals / Non-Goals

**Goals:**
- Retune the closed lid angle so the on-load pose reads as a genuinely-shut clamshell, matching the accepted spec.
- Add keyboard, trackpad, screen bezel, hinge line, subtle shading, and a closed-pose lid accent, using only CSS/DOM primitives.
- Keep every JOS-90 motion behavior and non-functional guarantee (scroll open/reorient, terminal reveal, reduced-motion, no-JS, 60fps, scrim, mobile) exactly as-is.

**Non-Goals:**
- Changing the scroll mapping, terminal content, or any of the reduced-motion/no-JS/mobile behaviors.
- Introducing an image/SVG asset or a 3D library (JOS-90's "CSS 3D, no deps, no assets" decision stands — `references` in that archived change reject Three.js on bundle/60fps grounds).
- Photoreal fidelity — the laptop sits dimmed behind text under a `bg-zinc-950/80` scrim and is decorative; "recognizable, not photoreal" is the bar (owner D2).

## Decisions

### 1. Closed pose: retune the closed lid angle to a genuinely-shut clamshell
The whole AC1 fix is choosing a closed-lid rotation that lays the lid flush against the base with no gap, rather than `-100°`. The exact target value is tuned visually against the running page (the geometry depends on the lid's `origin-bottom` hinge and the scene perspective), then locked as the new `CLOSED_LID_ROTATE_X` constant. **Alternative considered — restructure the hinge model** (place the lid *on top of* the base and fold it forward): rejected as unnecessary scope; the existing hinge geometry can produce a convincing closed pose with the right angle, and reworking it risks regressing the already-accepted open/reorient motion. The open end of the range (`OPEN_LID_ROTATE_X = 0`) and the reorientation constants are untouched.

### 2. Detail via static CSS-primitive children that ride existing transforms
The keyboard, trackpad, bezel, hinge, shading, and lid accent are added as **static child elements** inside the existing base and lid `<m.div>`s — they inherit the parent's 3D transform automatically, so they open/reorient with the laptop without any animation logic of their own.
- **Keyboard:** a CSS-grid (or flex rows) of small key `<div>`s on the base's top face — a moderate stylization (owner D2), not a per-key photoreal layout.
- **Trackpad:** a rounded rectangle centered below the keyboard.
- **Bezel:** an inner border/padding on the screen element framing the terminal (the screen is currently `inset-2 bg-black`; the bezel is a refinement of that).
- **Hinge:** a thin bar/line at the lid/base seam.
- **Shading:** replace the flat `bg-zinc-800` with a subtle gradient (still transform/opacity-safe; it's a paint property, not animated).
- **Closed-pose lid accent (D3):** a small centered mark on the lid's outward-facing top, visible in the closed pose.

All of these are new class strings in `components/HeroShellStyles.ts`, consumed by new child JSX in `components/HeroLaptop.tsx`. Because nothing here adds an independently-animated property, the 60fps / transform-only / CSP / First-Load-JS budgets are provably unaffected (Scenario "The added detail does not introduce motion or assets" locks this).

### 3. Decorative and degradation-safe by construction
The laptop layer stays `aria-hidden` — the added detail is purely visual, carries no semantic content, and doesn't affect heading order (protected by `accessibilityStructure.test.tsx`). The reduced-motion and no-JS states render the static *open* laptop; the keyboard/trackpad/bezel are visible there too (fine), and the `<noscript>` override is unchanged. Mobile stays `hidden sm:flex` — the laptop (and thus all this detail) is not rendered below `sm`, so no mobile cost.

## Risks / Trade-offs

- **[Risk] `HeroLaptop.test.tsx` is coupled to the exact transform literals** (`-100deg`, `-35deg`, `-8deg`). → Changing the closed angle breaks those assertions by design; the fix is to update them to the new constant and add keyboard/trackpad presence assertions. Called out explicitly in Tasks so it's not a surprise.
- **[Risk] The closed angle is a visual judgment a unit test can't fully verify.** → The unit test asserts the *constant/relationship* (closed ≠ open, closed is the new value), but the "reads as genuinely shut" quality is confirmed by a real browser check (Tasks §5), consistent with how JOS-90's 60fps/visual aspects were verified.
- **[Trade-off] Keyboard as DOM key-divs adds nodes.** → Kept moderate (a stylized grid, not 60+ individual keys), and it's inside the already-code-split hero layer; negligible against the First Load JS budget (which is unaffected regardless — this is client render cost, not bundle size).
- **[Risk] Detail could fight the scrim and hurt text contrast.** → The scrim (`bg-zinc-950/80`) sits above the laptop; added detail is behind it, so contrast is unchanged. Re-confirm in the visual check.

## Migration Plan

Branch → retune `CLOSED_LID_ROTATE_X` and visually confirm a shut clamshell → add keyboard/trackpad/bezel/hinge/shading/lid-accent child elements + styles → update `HeroLaptop.test.tsx` (new closed-angle literal + keyboard/trackpad presence) and keep the reduced-motion/no-JS/mobile assertions green → `npm test` / `tsc` / `validate:content` / `next build` clean → real browser check (closed-on-load reads shut; open state reads as a laptop; scrim/contrast intact; reduced-motion static; mobile still hidden) → merge → sync the delta into `openspec/specs/hero-signature-motion/` and archive. Rollback is a plain revert; the delta spec supersedes the prior `hero-signature-motion` wording only on archive.

## Open Questions

- None blocking. The exact closed angle, keyboard key count, and lid-accent mark are visual-tuning details settled during implementation, not design forks.
