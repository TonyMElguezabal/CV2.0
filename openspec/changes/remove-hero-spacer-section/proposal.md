Linear-Issue: JOS-114

## Why

`HeroFramer.tsx` renders a full-viewport (`min-h-screen`) spacer section
immediately after the hero, whose only content is the literal text "More
below". It exists solely to give the hero's "Scroll to explore ↓" CTA an
`id="hero-next"` anchor target. In practice it reads as a broken, empty
screen the visitor has to scroll past before reaching any real content —
reported as a bug (JOS-114: "this 'odd'/'empty' section should be
removed"). The next real section, `CareerChapters`, already exposes a
stable, already-used anchor (`id="career"`, the same target the header's
"Career" nav link points to), so the spacer's anchor duty is redundant
rather than necessary.

## What Changes

- Delete the spacer `<div id="hero-next">...More below...</div>` from
  `HeroFramer.tsx`, along with its now-unused `spacerSectionClass` style.
- Retarget the hero's primary "Scroll to explore ↓" CTA from `#hero-next`
  to `#career` — the existing anchor on `CareerChapters`, already covered
  by the site's universal anchor scroll-clearance rule.
- Update `HeroCtas.test.tsx`'s assertion of the primary CTA's `href` to
  match.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `hero-ctas`: the primary scroll CTA's requirement gains a scenario
  naming its actual scroll destination (`#career`, the first real content
  section) now that it no longer needs a dedicated placeholder anchor —
  mirroring how the existing Contact CTA requirement already names
  `#contact` as its destination.

## Impact

- `components/HeroFramer.tsx` — removes the spacer element and its
  `id="hero-next"`.
- `components/HeroShellStyles.ts` — removes the now-unused
  `spacerSectionClass` export.
- `components/HeroCtas.tsx` — primary CTA `href` changes from
  `#hero-next` to `#career`.
- `components/HeroCtas.test.tsx` — updates the primary-CTA anchor
  assertion.
- No change to `CareerChapters.tsx` (`id="career"` already exists), to
  the arrival sequence (deep-link skip detection is anchor-agnostic), or
  to the universal `[id] { scroll-margin-top }` clearance rule (`#career`
  is already covered).
