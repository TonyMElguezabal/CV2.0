## Context

A codebase a11y audit (2026-07-23) establishes the starting point. **Already compliant:** no global `outline:none` reset; `lang="en"`; `<main>`/`<nav aria-label>`/`<footer>` landmarks; the chat widget is `role="region"` + `aria-label`, non-modal, no focus trap; decorative spans are `aria-hidden` with `aria-label` on the parent link; the timeline uses `aria-current`; the hero's `prefers-reduced-motion` fade is implemented and owned by the `hero-signature-motion` spec; the career timeline uses `motion-safe:transition-colors`; `sr-only` is already in use. **Concrete gaps** (the work of this story):

| AC | Gap found |
|---|---|
| AC1 focus | Hero CTAs (`ctaPrimaryClass`, `ctaSecondaryClass`) and every chat-widget control (trigger, close, starter, submit, citation/contact links) have **no `focus-visible` ring** — they rely on the UA default. `chatInputClass` has `focus:outline-none`, actively **removing** the indicator (leaving only a weak `zinc-700→zinc-500` border change, and using `focus` not `focus-visible`). No skip-to-content link. |
| AC2 contrast | `zinc-500` on `#0a0a0a` ≈ 4.1:1 (borderline **fail** for normal text), `zinc-600` fails; used for real text in places (e.g. `projectSubheadingClass`). Element-specific backgrounds (panel `zinc-900`, error `red-950`, citation chips) are unverified. |
| AC3 reduced-motion | The **chat widget** panel animates `y: 12` on open/close with **no `useReducedMotion` guard** — motion plays regardless of preference. AC3 requires the fade-only alternative *site-wide*. |
| AC4 semantics | Heading **level skip**: hero `<h1>` → career-chapter `<h3>` with no `<h2>` between; the chapters (core narrative) sit at h3 while `Skills`/`Projects`/`Contact` are h2. No section heading introduces the chapters region. |

## Goals / Non-Goals

**Goals:**
- Close each gap above so all four ACs hold, with **minimal** visual change — compliance, not redesign.
- Make a11y **regression-tested**: automated `axe` structural checks on the key surfaces + a unit test that the chat widget honors reduced motion.
- Keep remediation DRY: one shared focus-ring utility, not per-component ad-hoc rings.

**Non-Goals:**
- Perf/Lighthouse (8.1) and CSP (8.4).
- Re-theming the palette — only the specific tokens that fail AA move, and only to the nearest compliant token.
- Changing any feature's behavior — focus rings, reduced-motion guards, and headings are additive.

## Decisions

### 1. One shared focus-ring utility in `components/a11yStyles.ts`
Export `focusRingClass = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-100"` (the treatment `ContactSection`/`CareerChapters`/`CareerTimeline` already use), and compose it into every interactive class string missing a ring — hero CTAs and all chat-widget controls. Replace `chatInputClass`'s `focus:outline-none` with `focus-visible` + the ring. Using `focus-visible` (not `focus`) keeps rings off mouse clicks but on keyboard focus — the modern, non-intrusive default.
- *Alternative considered:* a global `*:focus-visible` rule in `globals.css`. Rejected — less controllable per-surface (offset/color vary with element shape), and the repo's convention is per-component Tailwind class constants.

### 2. Skip-to-content link, visible on focus
Add `components/SkipToContentLink.tsx` rendering `<a href="#main" class="sr-only focus:not-sr-only …">Skip to content</a>` as the **first focusable element** (top of `<body>` in `app/layout.tsx`), and give `app/page.tsx`'s `<main>` `id="main"`. It stays visually hidden until focused, so it aids keyboard users without altering the visual design.

### 3. Chat widget honors reduced motion — mirror the hero
Guard `ChatWidget`'s `motion.div` with framer-motion's `useReducedMotion`: when reduced motion is preferred, drop the `y` offset and animate opacity only (`initial/animate/exit` become opacity-only), matching `HeroFramer`'s exact pattern. Test it with the same fake-`matchMedia` harness `HeroFramer.test.tsx` already uses. This is the one behavioral change; it is the AC3 "site-wide" closer.
- *Note:* the hero already complies (owned by `hero-signature-motion`); the timeline already uses `motion-safe`. After the widget fix, every animated surface honors the preference.

### 4. Contrast: audit against the *actual* background, remediate minimally
Compute each text token's ratio against the background it actually renders on — page `#0a0a0a`, panel `zinc-900` (`#18181b`), visitor bubble `zinc-200`, assistant bubble `zinc-800`, error `red-950` — not just the page background. For any **normal-size** text below 4.5:1 (large/bold text below 3:1), bump to the nearest compliant token (expected: `zinc-500`→`zinc-400` for muted labels; verify citation chips `zinc-400`-on-`zinc-900` and the `red-300`-on-`red-950` error). Placeholder text and purely decorative filler (`spacerSectionClass` "More below") are lower priority but reviewed. The exact list comes from the tool, not from guesswork — but the suspects are enumerated so the audit is targeted.
- *Tooling:* a contrast calculation (documented ratios) + `axe` in the browser via claude-in-chrome; jsdom `axe` cannot compute contrast (no layout/computed style), so contrast is a browser/manual gate.

### 5. Fix the heading outline with a chapters section heading
Add a heading for the career-chapters region in `CareerChapters.tsx` so the outline reads h1 (hero) → h2 (career) → h3 (each chapter) → h4 (chapter parts), removing the h1→h3 skip. Default to an `sr-only` `<h2>` ("Career" / "Career history") to fix the semantic outline **without** imposing a visible section title the current design deliberately omits (the timeline nav is the visual wayfinding). If the owner prefers a visible heading, it's a one-line change from `sr-only` to visible — noted, not blocking.
- *Alternative considered:* promote chapter titles h3→h2 (and parts h4→h3). Rejected — larger churn across every `<h4>` and it flattens the chapter-as-subsection semantics; the intervening h2 is cleaner.

### 6. Automated `axe` + targeted unit tests; contrast/SR manual
- **Automated (`npm test`):** add `vitest-axe`; render the key surfaces in jsdom (hero, a career chapter expanded, the chat widget open, contact section, and the composed page) and assert `toHaveNoViolations()` for the rules jsdom *can* evaluate — heading-order, landmark-unique, button/link accessible names, label associations, ARIA validity. Plus a focus unit test (interactive elements carry `focusRingClass`) and the ChatWidget reduced-motion test (Decision 3).
- **Manual/browser gate (owner):** keyboard tab-through confirming a visible focus stop on every control and that the skip link works; a contrast pass via claude-in-chrome/axe; a screen-reader read confirming the narrative order. Documented in tasks + README — the same manual-gate convention as the Lighthouse/eval/Upstash steps. jsdom fundamentally can't verify contrast or real focus rendering.

## Risks / Trade-offs

- **[Risk]** `axe` in jsdom gives false confidence — it can't check contrast or actual focus visibility (no layout). → **Mitigation:** scope automated assertions to structural rules only and make contrast + keyboard/SR an explicit manual gate; don't claim AC2 from jsdom.
- **[Risk]** Contrast bumps could drift the visual design. → **Mitigation:** move only tokens that fail, only to the nearest compliant token; enumerate the changed tokens in the PR for review.
- **[Risk]** The chat widget reduced-motion guard could regress the open/close behavior. → **Mitigation:** done test-first with the proven `matchMedia` harness; the non-reduced path is unchanged.
- **[Trade-off]** `sr-only` chapters heading fixes the outline invisibly — a screen-reader-only improvement the sighted owner won't see. Accepted; it's the correct semantic fix and preserves the visual design (visible heading offered as a trivial switch).

## Migration Plan

Implement per `tasks.md` (test-first where behavioral) → `npm test` / `tsc` / `validate:content` clean → dev-server + claude-in-chrome manual pass (keyboard focus on every control, skip link, reduced-motion fade on the widget, contrast via axe, heading outline) → merge. Rollback is a plain revert; every change is additive/stylistic and reversible. No data, no deps beyond `vitest-axe` (dev-only).

## Open Questions

- **Visible vs. `sr-only` chapters heading (Decision 5):** defaulting to `sr-only` to preserve the current design; flag for the owner at review — a one-line switch if a visible "Career" heading is wanted.
- Exact contrast remediations are produced by the audit tool during implementation (Decision 4), not pre-listed here beyond the enumerated suspects.
