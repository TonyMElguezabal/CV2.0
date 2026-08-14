## Context

The site's visual character lives almost entirely in six `*Styles.ts` files and
`app/globals.css`. Today those encode: one typeface (`system-ui`), one heading
size (`text-2xl`) shared by four sections, one container (`max-w-3xl px-6
py-24`) shared by four sections, and two greys (`zinc-300`, `zinc-400`).

`hero-laptop-cinematic-lighting` (JOS-105) demonstrated that adding craft to a
single element does not change how the page reads overall — the laptop got a
lighting rig and an off-axis crop, and the site still felt the same, because the
type and palette underneath were untouched. This change addresses the layer
JOS-105 deliberately left alone.

A four-way typographic specimen was built and reviewed before this proposal,
with all candidate faces embedded as woff2 data URIs (artifact CSP blocks font
CDNs, so linking them would have silently fallen back to system fonts and the
comparison would have been meaningless). The owner selected **wide geometric
sans** and the **1.4s** pace from that specimen.

## Goals / Non-Goals

**Goals**
- The site reads as deliberately designed rather than templated, before any new
  motion or layout work is done.
- Typographic and colour rules live in one place, so future sections inherit
  them instead of re-deciding.
- Every colour is verified against its real background at its real size.
- No new dependency, no third-party origin, no layout restructuring.

**Non-Goals**
- The editorial frame (fixed header, grid hairlines, progress rail).
- Asymmetric per-section layout — sections stay `max-w-3xl` centred here.
- Per-letter reveals, scroll-milestone activation, ambient particles, WebGL.
- Restyling `/admin` beyond inheriting the body font (it is an owner-only
  internal dashboard, not a designed surface).

## Decisions

### Decision 1: Archivo Expanded / Archivo, selected against real type

Four directions were built as a live specimen with the actual faces embedded,
not described in prose:

| # | Direction | Display / Body | Ratio | Reads as |
|---|---|---|---|---|
| 01 | Technical mono | Martian Mono 500 / Inter 400 | 5.6× | engineer, terminal-native |
| 02 | Authoritative serif | Newsreader 400 / Inter 300 | 6.1× | senior, considered |
| 03 | High-contrast serif | Instrument Serif 400 / Inter 300 | 7.25× | luxurious, fashion-editorial |
| **04** | **Wide geometric sans** | **Archivo Expanded 700 / Archivo 400** | **5.2×** | **modern, confident, product-led** |

Owner selected 04. It is the best genre fit for an engineering-leadership CV:
confident and contemporary without the fashion connotation of 03 or the
narrower legibility budget of 01 at large sizes. Deliberately **not** Space
Grotesk or Inter-as-display, both of which are current AI-generated-design
defaults.

Archivo is a single superfamily with `wght` and `wdth` axes, so display and body
come from one family — the pairing is harmonious by construction, and only one
family is fetched.

### Decision 2: `next/font`, never a CDN link — `local`, not `google` (found during implementation)

`next/font` downloads at build time and self-hosts the result. This matters
beyond convenience:

- **No third-party origin on the critical path** — preserves the
  `security-and-privacy-posture` capability's intent and avoids a CSP change.
- **Automatic `size-adjust` fallback metrics** — the fallback face is scaled to
  match the real one's metrics, so the swap causes no visible reflow. This is
  the main defence for the first-impression risk in Risks below — a heading
  that jumps mid-load undercuts the effect this change exists to produce.
- **Automatic preload** of the used subset.

The original plan was `next/font/google`. Implementation found a real
constraint that changed the specific API used, though not the substance of
this decision: `next/font/google`'s typed Archivo wrapper has no option to
pin a single width value — its `axes: ['wdth']` parameter only ever requests
the *full variable range*, never a fixed point. Measured directly against
Google Fonts' own CSS2 endpoint before choosing: the full weight+width
variable range is 90 KB raw; two fixed-weight instances with the width axis
still left variable are 73.6 KB combined. Both exceed the ~60 KB budget below.

The two files actually needed are **pinned single points** — `wdth,wght@125,700`
and `wdth,wght@100,400` — which Google serves as true static instances (not
ranges) at 14.5 KB and 14.6 KB, 28.4 KB combined. `next/font/google`'s typed
API has no parameter to request a pinned point on a secondary axis; only
`next/font/local` can, because it takes an actual font file rather than a
family/weight/subset query. So the two pinned files were downloaded once and
committed to `fonts/` at the repo root, loaded via `next/font/local` — same
self-hosting, same automatic `size-adjust` fallback metrics, same preload
behaviour, just pointed at files the `google` loader's own type signature
cannot reach. Verified via a real build: the emitted files in
`.next/static/media/` are byte-identical to the committed source.

Only the `latin` subset is needed; the site's content is English (`lang="en"`)
with occasional accented characters (`Muñoz`, `résumé`) that live inside Latin-1
— moot for the local files (their glyph coverage is already fixed by the source
file downloaded), but was the deciding constraint when the plan was still
`next/font/google`.

Both `app/(marketing)/layout.tsx` and `app/admin/layout.tsx` are independent
root layouts that each import `globals.css`, so the font variable class must be
applied in both, from one shared module — not duplicated per layout.

### Decision 3: A 5.2× scale, with section headings re-pitched

The current scale's real problem is not the display size, it is that
**four different section headings share one 24px size**, so nothing is
hierarchically distinguishable.

**Found during implementation: only three of those four were actually
section headings.** `CareerChapters`' own section-level `<h2>` is `sr-only`
(intentionally — "Career" is a landmark label, not visible chrome); the
visible 24px heading readers see for that section is `chapterHeadingClass`,
applied to a **per-chapter `<h3>`** (e.g. "Senior Software Development
Manager at Oracle"). It was sharing the section-heading class purely by
copy-paste, not by role — a real `<h2>` and a per-item `<h3>` were rendering
at an identical size, one level of the "four sections share one size"
problem the proposal already named, just not the one it expected. Resolved
by moving `chapterHeadingClass` (and `projectTitleClass`, confirmed to be
the equivalent per-card `<h3>` in Projects) to the chapter/project title
step below, and re-pitching only the three genuine `<h2>`s — Skills,
Projects, Contact — to the section-heading step. The new scale:

| Role | Size | Face / weight | Tracking |
|---|---|---|---|
| Hero display | `clamp(34px, 6.2vw, 88px)` | Expanded 700 | −0.035em |
| Section heading | `clamp(19px, 2.2vw, 28px)` | Expanded 700 | −0.03em |
| Chapter / project title | ~20–22px | Expanded 700 | −0.02em |
| Body | 17px / 1.68 | Regular 400 | normal |
| Meta (dates, labels) | 13–14px | Regular 400 | +0.02em where uppercased |

Display-to-body is 88/17 = **5.18×**. Fluid `clamp()` rather than
`sm:`/`md:` breakpoint jumps, so the scale is continuous — a large display size
must not require a separate mobile override that quietly reintroduces the flat
3× ratio on phones.

### Decision 4: One pace token, 1.4s `cubic-bezier(.16, 1, .3, 1)`

Owner-selected from the specimen's A/B. The current `0.6s` `easeOut` reads
brisk; `1.4s` on a strong ease-out curve reads unhurried, which is most of what
makes a page feel considered rather than transactional.

Exposed as a token (duration + easing + y-offset distance) rather than written
inline in `HeroFramer.tsx`, so subsequent entrance work inherits one pace
instead of each surface picking its own. `prefers-reduced-motion` continues to
collapse the y-offset entirely — a slower duration must not mean a longer
animation for people who asked for none.

**Found during implementation:** the hero previously used two *different*
y-offsets — 24px for the name, 16px for positioning — which this table didn't
call out because it predates noticing the split. "One shared token" is taken
literally: both now rise from the same 24px (the larger of the two, not a new
number), rather than staying independently tuned. This is a real, intentional
behavior change to the positioning line's rise distance, not just a
refactor — recorded here since nothing upstream pinned an exact px value.

### Decision 5: A bounded palette — three text tints and one hairline

The existing palette is unbounded in practice: any `zinc-*` step can be reached,
and none were verified. The replacement is deliberately small, and every value
was measured against the real `#0a0a0a` page background **before** being written
here:

| Token | Hex | Ratio vs `#0a0a0a` | Permitted use |
|---|---|---|---|
| `--ink` | `#ece7dd` | 16.07 | headings, emphasis |
| `--ink-body` | `#b9b2a6` | 9.41 | paragraphs |
| `--ink-meta` | `#8b8275` | 5.23 | dates, labels, footer |
| `--hair` | `#6f6558` | **3.47** | **borders and rules only — never text** |
| `--accent` | `#4d82bd` | 4.94 | accent word, links, terminal (from JOS-105) |

Neutrals are warm-biased (hue pulled toward the accent's complement) rather than
pure grey — a pure mid-grey reads as unconsidered; a grey with a slight bias
reads as chosen.

`--ink-meta` at 5.23:1 is the **floor for any text**. `--hair` sits below the
4.5:1 normal-text threshold and is therefore constrained to non-text use by
requirement, not by convention.

### Decision 6: The display gradient is restricted to large text

The gradient runs `#ffffff → #ece7dd → #9a8f7e → #6f6558` down the glyph. Its
darkest stop is 3.47:1 — **compliant for large text (≥3:1), non-compliant for
normal text (<4.5:1)**.

At the hero's 88px this is unambiguously large text under WCAG (≥24px, or
≥18.66px bold), so it is compliant as specified. **Scope, confirmed during
implementation:** despite this decision's own earlier framing suggesting section
headings (28px) might also qualify size-wise, the gradient is applied to the
hero display only — "display type," in the proposal's own words, names one
role, not every role that happens to clear the size threshold. Clearing the
threshold is a *constraint* the gradient must satisfy wherever it's used, not a
license to use it everywhere it would pass. The failure mode the restriction
guards against is still real and still likely: someone reusing the gradient
class on a 16px subheading months from now and silently dropping that text to
3.47:1 — which is exactly why the restriction is a **spec requirement with its
own scenario**, not a code comment, and why `components/heroGradient.test.tsx`
asserts the class is absent from every other heading role, not just present on
the hero.

**Structural finding during implementation:** the gradient class cannot live on
a shared ancestor of the hero's lead text and its accent word (Decision 6 vs.
Decision 6-adjacent — see the accent-word discussion below). `-webkit-text-
fill-color` inherits to children in WebKit/Blink; a child that sets only its
own `color` does not override an inherited `-webkit-text-fill-color:
transparent`, so nesting the accent span inside a gradient-classed parent would
silently render the accent word invisible too. The gradient class and the
accent class are therefore siblings — two separate `<span>`s inside the
heading — never parent and child.

`background-clip: text` also keeps the underlying text real and selectable — it
is a paint treatment, not an image replacement, so screen readers, search
engines, and the RAG indexer are unaffected. And deliberately not Tailwind's
`text-transparent` utility (unconditional `color: transparent`, no fallback
path) — the fallback for browsers without `background-clip: text` support is
the ordinary inherited `text-ink` color, which only works because the
transparency comes from the vendor-prefixed `-webkit-text-fill-color`
specifically, a property non-WebKit browsers without the feature simply ignore
rather than partially applying.

### Decision 7: Sections stay centred; the frame is a separate change

It is tempting to bundle the asymmetric column grid here, since "break the
shared axis" was one of the four original decisions. It is deliberately excluded:

- JOS-105 already broke the axis **where it mattered most** (hero laptop
  off-axis, hero copy left-anchored).
- Re-laying-out five content sections is a structural change with its own
  responsive risk, and it collides with `CareerTimeline`'s fixed left rail —
  a collision this project has already been bitten by once (JOS-105 task 11.2).
- The frame change will need to reconcile that rail with a fixed header anyway.
  Doing the layout work twice is worse than doing it once, later, with the
  navigation question settled.

The type scale alone is what converts "info page" to "designed page." Layout
asymmetry compounds it but does not substitute for it.

## Risks / Trade-offs

- **~~Fonts land on the critical path~~ — deprioritized by owner decision
  (2026-08-13).** This adds ~28–60 KB of woff2 where JOS-105 added zero. The
  owner has ruled that page-weight and Core Web Vitals are not a constraint for
  this site: it is distributed by direct URL to recruiters and via a résumé, not
  through search, and current hardware absorbs the cost. Lighthouse/LCP are
  recorded for information only and gate nothing. The `latin`-subset limit and
  the static-instance fallback (Decision 2) are kept as hygiene, not as budget
  compliance.
- **Font-swap reflow — kept, and reframed as a visual-quality risk.** This one
  survives the deprioritization above, because it is not a metrics problem: a
  heading that visibly jumps or re-wraps as the real face replaces its fallback
  is a *first-impression* failure, and the first impression is the entire point
  of this change. `next/font`'s `size-adjust` fallback metrics are the defence;
  it is verified by watching a real page load, not by reading a CLS score.
- **A 5.2× scale makes long headings harder.** The site's real worst case is
  not "Jose Muñoz" but "Senior Software Development Manager at Tata Consultancy
  Services (Banco de Crédito del Perú account)". *Mitigation:* section and
  chapter headings sit at 28px/22px, not 88px; `text-wrap: balance` on headings;
  the longest real chapter and project titles are checked in a browser at
  360/768/1440px, not just the short ones.
- **Warm neutrals over a near-black ground can read muddy** if the bias is
  overdone. *Mitigation:* the bias is slight and every tint is measured; if a
  tint looks muddy in the real page, it may be adjusted **upward** in contrast
  only, never downward.
- **`/admin` inherits the body font** since both root layouts share
  `globals.css`. This is intentional (consistency, one token) and low-risk, but
  it does mean a font regression would surface on the dashboard too — so the
  admin route gets a smoke check, not just the marketing route.
