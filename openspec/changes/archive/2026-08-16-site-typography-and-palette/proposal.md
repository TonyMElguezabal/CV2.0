Linear-Issue: JOS-108

## Why

CareerDNA reads as an information page with a nice animation behind it. That is
not an impression — it is what the stylesheets literally say. Four of the five
content sections share one container class, verbatim:

```
CareerChaptersStyles.ts   →  mx-auto max-w-3xl px-6 py-24
SkillsSectionStyles.ts    →  mx-auto max-w-3xl px-6 py-24
ProjectsSectionStyles.ts  →  mx-auto max-w-3xl px-6 py-24
ContactSectionStyles.ts   →  mx-auto max-w-3xl px-6 py-24
```

and four share one heading class, verbatim: `text-2xl font-semibold
tracking-tight`. The entire motion budget below the hero is `transition-colors`
×2, `transition-transform` ×1, and `animate-bounce` ×2 — no component outside
`HeroFramer`/`HeroLaptop`/`ChatWidget`/`ChatPanel` imports the motion library at
all. The result is a 768px centred column repeated four times, in two greys, at
one heading size, with no motion.

`hero-laptop-cinematic-lighting` (JOS-105) added a lighting rig to the hero and
did it well, but it deliberately scoped itself to the laptop. It could not fix
the site's overall character because the two loudest signals — **typeface and
type scale** — were never touched. `--font-sans` is still `system-ui`, and the
display-to-body ratio is 3.0× (60px over 20px), which is the ratio of a SaaS
landing page, not a designed one. Spectacle layered over default typography
still reads as default.

This change makes the four decisions that carry most of the site's visual
character, none of which require new layout, new components, or new motion
machinery.

## What Changes

- **A real typeface pair, self-hosted.** Display: **Archivo Expanded 700**.
  Body: **Archivo 400**. Owner-selected from a four-way specimen (technical
  mono / authoritative serif / high-contrast display serif / wide geometric
  sans) built with the real faces embedded as woff2 data URIs, so the choice
  was made against actual type rather than fallbacks. Loaded via `next/font`
  (build-time self-hosted) — **not** a Google Fonts CDN link, which would add a
  third-party origin to the critical path and conflict with the site's
  privacy/CSP posture.

- **A 5.2× display-to-body type scale**, replacing the current 3.0×. Display
  drops from `text-4xl/sm:text-6xl` (36→60px) to a fluid
  `clamp(34px, 6.2vw, 88px)`; body settles at 17px/1.68; section headings and
  chapter/project titles are re-pitched against the same scale instead of all
  sharing one 24px size.

- **One unhurried motion pace.** The hero's entrance goes from `0.6s`
  `easeOut` to **`1.4s cubic-bezier(.16, 1, .3, 1)`**, exposed as a token so
  every future entrance inherits it rather than re-deciding. (Verified: the
  `hero-signature-motion` capability's entrance scenario specifies *that* the
  name fades and slides, not *how fast* — so this contradicts no accepted
  requirement and needs no amendment.)

- **A bounded, measured palette.** The flat `zinc-*` scale is replaced by three
  warm-biased text tints plus one non-text hairline tint, and the sapphire
  accent (`#4d82bd`, already chosen in JOS-105 for the terminal and the light
  the screen casts) is extended site-wide. Display type gains a subtle vertical
  gradient via `background-clip: text` — paint-only, real selectable text
  underneath.

- **Every colour was measured against `#0a0a0a` before being written into the
  spec, not after:**

  | Token | Hex | Ratio | Normal (4.5) | Large (3.0) |
  |---|---|---|---|---|
  | `--ink` — headings | `#ece7dd` | 16.07 | PASS | PASS |
  | `--ink-body` — paragraphs | `#b9b2a6` | 9.41 | PASS | PASS |
  | `--ink-meta` — dates, labels | `#8b8275` | 5.23 | PASS | PASS |
  | `--hair` — **borders only** | `#6f6558` | 3.47 | **FAIL** | PASS |
  | accent sapphire | `#4d82bd` | 4.94 | PASS | PASS |
  | gradient darkest stop | `#6f6558` | 3.47 | **FAIL** | PASS |

  Two consequences are encoded as requirements rather than left to discipline:
  `#6f6558` is a **hairline tint that may never carry text**, and the display
  gradient — whose darkest stop is that same value — is **restricted to large
  text**, so it cannot be reused on a 16px subheading and silently break AA.

- **Out of scope, each its own change:** the editorial frame (fixed header, grid
  hairlines, scroll progress rail); asymmetric per-section layout (sections stay
  `max-w-3xl` centred here); per-letter blur-up title reveals; scroll-milestone
  section activation; the ambient particle/spark layer; anything WebGL.

## Capabilities

### New Capabilities
- `site-visual-language`: the single source of truth for the site's typographic
  system (display/body faces, self-hosting obligation, scale ratio), its motion
  pace token, its bounded palette with per-tint contrast obligations, and the
  large-text-only restriction on gradient display type. Other capabilities
  render *content*; this one defines what that content looks like, so the rules
  live in one place instead of being re-litigated per section.

### Modified Capabilities
_None._ Verified rather than assumed: `hero-signature-motion`'s entrance
scenario pins no duration, and `accessibility-compliance` already requires
"4.5:1 for normal-size text and 3:1 for large text" generically — this change
satisfies that requirement with measured values rather than changing it.

## Impact

- **Modified files:** `app/globals.css` (font + palette tokens via
  `@theme inline`), a new shared `next/font` module, both root layouts
  (`app/(marketing)/layout.tsx`, `app/admin/layout.tsx` — both import
  `globals.css` and both need the font variable class on `<html>`),
  `components/HeroShellStyles.ts`, `components/HeroFramer.tsx` (pace),
  and the five section stylesheets (`CareerChapters`, `CareerTimeline`,
  `SkillsSection`, `ProjectsSection`, `ContactSection`, `SiteFooter`).
- **Performance is explicitly not a gate on this change (owner decision,
  2026-08-13).** The site is distributed by pasting its URL to recruiters and
  printing it on a résumé — not through search discovery — so crawl/index
  standing and Core Web Vitals scores carry little value here, and current
  hardware absorbs the added weight. Lighthouse/LCP figures are recorded as
  information; **nothing in this change blocks on them.** Two adjacent concerns
  survive the reframe and stay as requirements, because they are
  *visual-quality* problems rather than metrics problems: **(a)** the font swap
  must not visibly reflow the page — a heading that jumps as the real face
  loads actively undermines the first impression this change exists to create;
  **(b)** the OpenGraph share card now matters *more*, not less, since a pasted
  link's preview is the literal first thing a recruiter sees.
- **This deprioritization contradicts an accepted capability.**
  `performance-budget-compliance` currently requires Lighthouse ≥90, LCP
  budgets, and an enforced First Load JS ceiling. Those requirements are not
  amended here — reconciling them with the owner's distribution model is its
  own change, deliberately kept separate so the decision is made once and
  explicitly rather than eroded silently by successive changes that each
  "just this once" skip the gate.
- **Accessibility:** net-neutral-to-positive — every tint is measured and at or
  above its threshold, versus the current palette which was never verified.
  Body text grows 16→17px. The two constraints above are regression-tested.
- **No new dependency** (`next/font` ships with Next), no new network origin,
  no backend/endpoint/schema/content-model change.
