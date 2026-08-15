Linear-Issue: JOS-111

## Why

The content sections have no motion at all. Audited across the six section
stylesheets, the complete animation budget below the hero is `transition-colors`
×2, `transition-transform` ×1, and `animate-bounce` ×2 — and no component outside
`HeroFramer`, `HeroLaptop`, `ChatWidget`, and `ChatPanel` imports the motion
library. Content simply appears, fully formed, as it scrolls into frame.

`docs/PRD2.md`'s reveal vocabulary — headings resolving character by character
out of a blur, sections rising into place — is what makes its reference page feel
authored rather than rendered. This change brings that to CareerDNA's content,
which is the last of the three "surprise" windows identified during exploration
(arrival → JOS-112, ambient → JOS-110, scroll → here).

## What Changes

- **Blur-up heading reveals, built as a cross-fade rather than an animated blur.**
  Each character carries two stacked copies — one pre-blurred, one sharp — and
  only their opacities cross-fade, alongside a shared rise. The blur is rendered
  once and cached as a compositing layer; nothing re-runs a convolution per
  frame.

  **This means the change needs no spec amendment at all**, which was not the
  expected outcome. Animating `filter: blur()` directly would have required
  amending the site-wide 60fps requirement — one that has been deliberately
  affirmed three times (JOS-105 built its entire lighting rig around it, JOS-107
  kept it while removing four neighbouring requirements, JOS-110 broadened it to
  cover canvas). The cross-fade animates **only `opacity` and `transform`**, so
  every existing guarantee holds untouched.

- **Section entrance reveals** — content fades and rises as its section enters
  the viewport, using the same `IntersectionObserver` pattern `CareerTimeline`
  already establishes, and the shared pace token from JOS-108.

- **A hard guarantee that content is never left hidden.** This is the requirement
  that matters most and the one a naive implementation gets wrong: if a reveal
  never fires — observer edge case, JS error, unsupported browser — the content
  it was gating must still be readable. A CV whose Oracle tenure is invisible
  because an observer callback did not run is worse than a CV with no animation.

- **Reveals are scoped to headings and section entrances only.** Career chapter
  body text, dates, metrics, and skill evidence are not gated behind scroll
  position. Laocoön could gate everything because it has ~40 words; this page
  carries a career history a recruiter scans in about 90 seconds. The framing is
  **cinematic frame, legible content** — spectacle at the seams, substance always
  present.

- **Two correctness problems that per-character splitting creates**, both easy to
  ship broken because both look fine on screen:
  1. **Copied text would double.** With two stacked copies per character,
     selecting a heading yields `JJoossee  MMuuññoozz`. The blurred ghost must be
     excluded from selection.
  2. **The accessible name would fragment.** Splitting a heading into per-character
     elements can cause assistive technology to announce it letter by letter. The
     heading's accessible name must remain the full, unbroken text.

- **Dropped from scope on inspection:** PRD2's `clip-path` image wipe with
  parallax zoom. Project cards have no images — there is no `image` field in
  `lib/content/schemas.ts` and no `<img>` in `ProjectsSection.tsx`. Rather than
  invent an image requirement to justify an effect, the effect goes.

## Capabilities

### New Capabilities
- `site-scroll-reveal`: the scroll-triggered reveal system — the heading
  treatment and its cross-fade construction, section entrance reveals, the
  never-leave-content-hidden guarantee, the scope limit that keeps substantive
  content ungated, and the correctness obligations that per-character splitting
  introduces.

### Modified Capabilities
_None._ Verified rather than assumed. The cross-fade construction animates only
`opacity` and `transform`, so `performance-budget-compliance`'s 60fps requirement
is satisfied as written. `accessibility-compliance`'s site-wide reduced-motion
rule is satisfied by the fade-only alternative specified here. JOS-105's
transform/opacity clause turns out to be **laptop-scoped** — it governs "the
laptop's detail elements", not text elsewhere — so it was never the binding
constraint that JOS-111's original ticket claimed.

## Impact

- **Modified files:** a reveal utility/hook and a heading-split component, plus
  `HeroShellStyles.ts` and the section stylesheets and components that adopt
  them. No changes to content, schemas, or the RAG pipeline.
- **Accessibility is the main surface area.** Two of the three headline risks
  (copied-text doubling, fragmented accessible name) are accessibility or
  usability defects that no visual review would catch, and the third
  (content-left-hidden) is the most severe failure this change could produce.
  All three are requirements with their own scenarios rather than implementation
  notes.
- **No new dependency.** `framer-motion` is already present and lazily loaded via
  `MotionProvider`; `IntersectionObserver` is built in and already used by
  `CareerTimeline`.
- **Nothing is added to the Cloudflare Worker bundle** (JOS-106) — this is client
  code, which ships as a static asset.
- **Depends on JOS-108** for the shared pace token and type scale. Reveals
  animate the type, so the type has to exist first, and the reveal timing should
  inherit one pace rather than introducing a second.
