## Why

The hero currently plays a modest signature sequence (a scroll-driven text fade plus a staggered name/positioning entrance). PRD §5 F1 calls for a memorable, "this-is-not-a-résumé" first impression. JOS-90 replaces that sequence with a distinctive, page-spanning motif: a closed MacBook — angled toward the lower-left and tilted down — that opens and reorients to face the visitor as they scroll the whole page, revealing a terminal at the bottom. This becomes the site's signature animated element.

## What Changes

- **The signature sequence becomes a whole-page laptop.** A closed, lower-left-angled MacBook renders on load as a persistent background layer. Its lid opens and its body reorients toward front-facing in proportion to **full-document** scroll progress (transform only), reaching fully open + front-facing at the bottom of the page.
- **A terminal is revealed at the end.** Once fully open, a terminal window is shown/readable on the laptop screen; its text is content-sourced.
- **A legibility scrim** keeps the laptop subdued behind page content so all text continues to meet contrast requirements.
- **Reduced-motion and no-JS states** are redefined for the laptop: under `prefers-reduced-motion: reduce` (or no JS) the laptop renders static, fully open, front-facing with the terminal visible — no scroll-linked animation — and all text stays readable.
- **Mobile is simplified** — the full-page fixed 3D motif is reduced (smaller/static or hero-scoped) to protect readability and performance on small viewports.
- **Render technique is CSS 3D transforms** (styled divs/SVG), reusing the existing `LazyMotion` boundary. **No new heavy dependency** (no Three.js/Lottie).
- **Out of scope:** wiring the terminal to the real chatbot/"Ask AI"; changing the analytics, chat, or content-rendering capabilities; adding a résumé/contact CTA.

## Capabilities

### New Capabilities

_None._ The laptop is the site's signature motion; it is modeled as a broadening of the existing `hero-signature-motion` capability rather than a parallel one, to keep a single capability owning "the site's signature animated sequence."

### Modified Capabilities

- `hero-signature-motion`: the default signature sequence is redefined from a hero-contained text fade to a **whole-page laptop that opens, reorients to front-facing, and reveals a terminal** driven by full-document scroll; the `prefers-reduced-motion` alternative and the no-JS readable state are redefined for the laptop (static, fully-open, terminal visible); new requirements cover the terminal reveal, the behind-content legibility scrim, and the simplified mobile behavior. The existing 60fps requirement is retained and restated to cover the laptop's scroll animation.

## Impact

- **Modified files:** `components/HeroFramer.tsx` (mount the fixed laptop layer + scrim; reconcile with the existing text sequence), `app/page.tsx` (host the whole-page layer), `components/HeroShellStyles.ts` (perspective/sticky/scrim classes), `lib/content/schemas.ts` + `/content/*` (terminal text as validated content), `app/layout.tsx` if wiring is needed.
- **New files:** `components/HeroLaptop.tsx` (+ jsdom test); optionally `components/Terminal.tsx` (+ test).
- **Tests touched:** `components/HeroFramer.test.tsx`, `components/accessibilityStructure.test.tsx` (heading order must stay intact).
- **Capabilities this change must continue to satisfy (not modified):** `performance-budget-compliance` (transform/opacity only, 60fps, First Load JS ≤ ~160 KB gzip, laptop must not become the LCP element) and `accessibility-compliance` (decorative `aria-hidden` laptop/terminal, contrast via the scrim, reduced-motion, no-JS readability).
- **No new dependency, no new endpoint, no schema for the API, no new environment variable.** Any raster asset (if used) must respect the CSP (`img-src 'self' data:`); the recommended approach uses CSS/SVG + an emoji-free terminal, so no external asset host is involved.
