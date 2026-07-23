## Why

PRD §9 requires WCAG 2.1 AA intent — keyboard-navigable with visible focus, AA-contrast dark theme, a site-wide `prefers-reduced-motion` alternative, and semantic HTML that reads in correct order in a screen reader. The codebase already has a strong baseline (semantic landmarks, `lang="en"`, `aria-*` on the timeline/skills, the hero's reduced-motion fade), but a codebase audit surfaces concrete gaps: several interactive surfaces lack a visible focus indicator (and the chat input actively removes it), the chat widget's open/close animation ignores `prefers-reduced-motion`, the career-chapters headings skip a level (h1→h3), there is no skip-to-content link, and the muted dark-theme text tokens are unverified for AA contrast. This is story 8.2 of the Epic 8 quality gate (JOS-75) — a cross-cutting audit and remediation across every interactive surface.

## What Changes

- **Visible focus everywhere (AC1):** introduce one shared focus-ring utility and apply it to every interactive surface currently missing it — the hero CTAs (`Scroll`, `Ask AI`, `Download résumé`, `Contact`) and all chat-widget controls (trigger, close, starter buttons, submit, citation/contact links). Replace the chat input's `focus:outline-none` (which suppresses the indicator) with a proper `focus-visible` ring.
- **Skip-to-content link (AC1):** add a keyboard-first "Skip to content" link (visible on focus) so keyboard users can bypass the career-timeline nav and jump to `<main>`.
- **Site-wide reduced-motion (AC3):** bring the **chat widget** into compliance — its open/close animation currently slides (`y: 12`) regardless of preference; guard it with `useReducedMotion` to a fade-only transition, mirroring the hero's existing pattern. Audit remaining transitions for movement that must be suppressed.
- **AA contrast (AC2):** audit every text token against its *actual* background (page `#0a0a0a`, panel `zinc-900`, message bubbles, error `red-950`) with a contrast tool; remediate normal-size text below 4.5:1 (the `zinc-500`/`zinc-600` muted tokens are the prime suspects) by bumping to a compliant token, minimally and only where it fails.
- **Semantic reading order (AC4):** fix the heading outline — add a section heading for the career-chapters region so the outline is h1→h2→h3 instead of skipping h1→h3, and verify the whole-page outline and landmark structure with automated `axe` heading-order/landmark rules.
- **Automated a11y regression tests:** add `vitest-axe` and assert no structural violations (heading-order, roles, accessible names, labels, landmarks) on the key surfaces, so a11y doesn't regress silently. Contrast and full keyboard/screen-reader passes remain a manual/browser gate (jsdom cannot compute contrast).
- **Out of scope:** the Lighthouse/perf budget (8.1, JOS-74), CSP/security headers (8.4, JOS-77), and any redesign of the visual language beyond the minimal token bumps AA requires.

## Capabilities

### New Capabilities
- `accessibility-compliance`: the site-wide accessibility guarantees — visible focus on every interactive element, AA contrast against each element's real background, a `prefers-reduced-motion` fade-only alternative across *all* animated surfaces (including the chat widget), and a semantic, correctly-ordered heading/landmark structure with a skip link.

### Modified Capabilities
_None._ These are cross-cutting quality guarantees layered over existing features; they don't change any feature capability's requirements. The hero's reduced-motion behavior stays owned by `hero-signature-motion` (already compliant); `chat-widget-entry-point`'s requirements are unchanged (it never specified its own animation or focus styling — this adds the site-wide guarantee that also covers it).

## Impact

- **New files:** `components/a11yStyles.ts` (the shared `focusRingClass` constant); `components/SkipToContentLink.tsx` (+ SSR test); a11y test files using `vitest-axe` for the key surfaces (hero, chapters, chat widget open, contact, full page); a ChatWidget reduced-motion test mirroring `HeroFramer.test.tsx`'s fake-`matchMedia` harness.
- **Modified files:** `components/HeroShellStyles.ts`, `components/ChatWidgetStyles.ts` (focus rings; input ring fix; contrast token bumps), plus any other `*Styles.ts` a contrast/focus audit flags; `components/ChatWidget.tsx` (`useReducedMotion` guard on the panel motion); `components/CareerChapters.tsx` (section heading for the chapters region); `app/layout.tsx` + `app/page.tsx` (skip link + `<main id>`); potentially small `aria`/heading tweaks the audit surfaces.
- **New dev dependency:** `vitest-axe` (a11y assertions in the existing vitest/jsdom setup). No runtime dependencies.
- **No endpoints, no database, no content changes.** Verification is unit/axe tests in `npm test` plus a manual keyboard + screen-reader + contrast pass (browser), documented as the owner gate — matching the repo's convention for checks that a headless jsdom run can't fully make.
