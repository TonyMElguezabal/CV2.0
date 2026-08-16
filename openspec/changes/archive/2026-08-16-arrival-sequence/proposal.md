Linear-Issue: JOS-112

## Why

The stated goal for this site is that it "must surprise anyone the moment they
see the page." Decomposed during exploration, "surprise" turned out to be three
separate problems with different machinery and different costs:

| Window | When | Cost | Covered by |
|---|---|---|---|
| **① Arrival** | first 0–2s, orchestrated | one-shot, free once it ends | **this change** |
| ② Ambient | always running | CPU for the whole session | JOS-110 |
| ③ Scroll | on demand | cheap, reuses scroll progress | JOS-111 |

**① is the cheapest of the three and the closest match to the actual goal** —
"the moment they see the page" *is* the arrival window — and it is the only one
with nothing built. Today the site's entire arrival experience is the hero name
and positioning fading in. Everything else is simply present.

It is also the only one that costs nothing after it finishes: an orchestrated
1.5-second entrance leaves no continuous loop and no scroll listener behind.

## What Changes

- **An orchestrated page-load sequence** in which elements arrive in a
  deliberate order with overlapping timing, rather than each fading in
  independently: the ground establishes, the frame's hairlines draw in, the
  laptop settles into its closed pose, the display type resolves, the accent
  sweeps, and the ambient layer fades up. The point is the *choreography* —
  independent fades are what the site does today.

- **One rhythm, not six timings.** Every step derives from JOS-108's shared pace
  token, so the sequence reads as one movement rather than as several components
  each animating on their own schedule.

- **Bounded, and never a gate on reading.** The sequence completes within a
  bounded time, all content reaches its final state when it ends, and the page
  stays interactive throughout — links and buttons work as soon as they render
  rather than waiting for the choreography to finish. If the sequence fails to
  run at all, content is simply in its final state.

- **Deep-linked arrivals skip it.** If the page loads with a fragment targeting
  a section — a shared `#contact` link, or a return to a mid-page anchor — the
  browser is scrolling elsewhere and a hero choreography is both invisible and
  wrong. Detected and skipped.

- **It plays every load, and stores nothing.** Suppressing replays for returning
  visitors would need client storage. `cookieless-analytics-baseline` requires
  "no cookies, no persistent client storage" for analytics, and `lib/session.ts`
  deliberately keeps even its session id in memory only for the same reason.
  Reaching for `sessionStorage` to skip an animation would cut against a
  convention this codebase holds on purpose — so the sequence simply always
  plays. It is short, and for a link-shared CV most visits are first visits.

- **Fonts are not a hard gate.** JOS-108 requires that the font swap cause no
  visible reflow (`next/font`'s metric-matched fallback is the mechanism), so
  waiting on `document.fonts.ready` before starting would trade a real cost —
  dead time at the exact moment the sequence exists to fill — against a risk that
  change already eliminates. Instead the text steps are simply ordered after the
  non-text ones, which is better choreography regardless, and the sequence never
  stalls waiting for a font that has not arrived.

- **Coordinates with the other two motion systems** so the same element is never
  animated twice: the hero's entrance belongs to this sequence, not to JOS-111's
  scroll reveals, and JOS-110's ambient layer fades up as a sequence step rather
  than appearing abruptly.

## Capabilities

### New Capabilities
- `site-arrival-sequence`: the page-load choreography — that it exists and is
  ordered rather than simultaneous, its bounded duration, its
  never-block-reading and never-block-interaction guarantees, the deep-link skip,
  the no-storage/always-play rule, and its coordination with the ambient and
  scroll-reveal systems.

### Modified Capabilities
_None._ Verified rather than assumed. `hero-signature-motion`'s entrance scenario
requires that the name and positioning animate in with a fade and a y-offset —
this sequence continues to satisfy that, orchestrating the same entrance rather
than replacing it, and that scenario pins no timing. The site-wide reduced-motion
and 60fps requirements are satisfied as written.

## Impact

- **Modified files:** an arrival-sequence orchestrator (a small client module
  plus a provider or hook), `app/(marketing)/layout.tsx` to mount it, and the
  participating components — `HeroFramer`, `HeroLaptop`, and, once they exist,
  the editorial frame (JOS-109) and ambient layer (JOS-110) — to take their
  entrance timing from it rather than defining their own.
- **Depends on JOS-108** for the pace token. **Coordinates with JOS-109, JOS-110,
  and JOS-111**, but does not hard-require them: the sequence should degrade to
  choreographing whichever participants exist, so it can land before or after any
  of them.
- **No new dependency.** `framer-motion` is already present and lazily loaded;
  the orchestration is timing, not a new animation engine.
- **Nothing is added to the Cloudflare Worker bundle** (JOS-106) — client code
  ships as a static asset.
- **The main risk is not technical.** A 1.5-second entrance that delights on
  first view can irritate on the fifth, and this site's own owner will see it
  more than anyone. That is an argument for keeping it short and for resisting
  the urge to extend it, not for adding storage to suppress it.
