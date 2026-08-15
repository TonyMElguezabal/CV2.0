## Context

The site's entire arrival experience today is `HeroFramer` fading in the name and
positioning text. Everything else — the laptop, the sections, the chat trigger —
is simply present when the page paints.

Exploration split "surprise the moment they see the page" into three windows:
arrival, ambient, and scroll. This change is the arrival window, and it is the
only one whose name matches the goal literally. It is also the cheapest: unlike
the ambient layer it leaves nothing running, and unlike scroll reveals it needs
no observer.

## Goals / Non-Goals

**Goals**
- One choreographed entrance instead of several independent fades.
- A sequence that never becomes a reason the page cannot be read or used.
- Coordination, so that adding the frame, the ambient layer, and scroll reveals
  does not produce four motion systems fighting over the same elements.

**Non-Goals**
- Continuous motion (JOS-110) or scroll-linked motion (JOS-111).
- A loading screen. The page is static-first and paints fast; a deliberate
  "loader" would add delay in order to fill it, which inverts the point.
- Suppressing the sequence for returning visitors — see Decision 3.

## Decisions

### Decision 1: Orchestration is the feature; individual animations are not

The site already fades elements in. What it does not do is make them arrive *in
relation to each other*. A sequence where the ground establishes, then hairlines
draw, then the laptop settles, then type resolves — with deliberate overlap —
reads as authored. The same elements animating simultaneously on independent
timers read as a page that happens to have transitions.

This is why the spec requires *ordering with overlapping timing* and a *shared
pace token* rather than enumerating specific steps: the ordering is the
requirement, while the exact step list depends on which participants exist when
this lands (Decision 6).

### Decision 2: Do not gate the sequence on webfonts

The open question carried into this change was whether to wait for
`document.fonts.ready` before starting, to avoid type reflowing mid-choreography.

Not gating, for two reasons. First, JOS-108 already requires that the font swap
cause **no visible reflow** — `next/font`'s metric-matched `size-adjust` fallback
is the mechanism, and it is a stated requirement of that change rather than a
hope. Waiting would spend a real cost to avoid a risk another change has already
eliminated. Second, the cost is precisely the wrong one: dead time at the exact
moment this sequence exists to fill. A page that sits blank for 300ms and then
performs beautifully has already lost the arrival.

Instead the choreography is *ordered* so that non-text steps come first. That is
better choreography on its own terms — establishing the ground before the type is
the natural order anyway — and by the time the type step is due, a preloaded,
self-hosted font is almost certainly resolved. The spec also forbids stalling: if
the font is not ready when its step is due, the sequence proceeds.

### Decision 3: Play every load, store nothing

Suppressing replays for returning visitors requires remembering that they have
visited, which means client storage.

`cookieless-analytics-baseline` requires "no cookies, no persistent client
storage" — scoped to analytics, so it does not literally forbid this. But
`lib/session.ts` keeps even its session id in memory only, with a comment
explaining that it is deliberate. Introducing `sessionStorage` to skip an
animation would cut against a convention this codebase holds on purpose, for a
benefit that is small.

So the sequence always plays. That makes the *duration* the thing to be
disciplined about instead — which is the right constraint anyway, since the
person who will see this sequence most often is the site's own owner. Short
enough not to irritate on the fifth viewing is a better design target than
"delightful once, then suppressed."

### Decision 4: Deep-linked arrivals skip it

A shared `#contact` link, or any anchored return, means the browser scrolls away
from the hero immediately on load. Running a hero-centred choreography then is
both invisible and wrong — and worse, it can fight the browser's scroll
restoration.

Detecting a fragment on load and skipping to final state is a few lines and
prevents a class of confusing behaviour. This is the same category of bug as
JOS-111's "reveal never fires for content the visitor lands beside", and both
changes now handle it explicitly.

### Decision 5: Bounded, non-blocking, and fail-visible

Three related guarantees, because an entrance sequence is a natural place to
accidentally make a page unusable:

- **Bounded** — it ends, and everything is in final state when it does.
- **Non-blocking** — controls work while it plays. A visitor who arrives knowing
  they want the résumé should not have to wait out a flourish to click it.
- **Fail-visible** — if it never runs, content is simply there. Same principle as
  JOS-111's Decision 2, and the same `<noscript>` precedent from `HeroFramer` and
  `HeroLaptop`.

The failure this prevents is the worst one available to this change: a CV that
shows nothing because an orchestrator threw.

### Decision 6: One owner per element, and tolerate absent participants

By the time all of JOS-109 through JOS-112 land, four systems could plausibly
animate the hero: the laptop's own scroll binding, the arrival sequence, the
scroll-reveal system, and the ambient layer's entrance.

The rule is **one owner per element's entrance**. The hero's entrance belongs to
the arrival sequence; JOS-111's scroll reveals must not also claim it. The
ambient layer enters as a sequence step rather than fading up on its own timer.

And because these changes can land in any order, the sequence must **choreograph
whatever exists** — if the editorial frame or ambient layer is not present, it
sequences the remaining participants and completes normally. That keeps this
change independently shippable rather than blocked behind three others.

## Risks / Trade-offs

- **Delight becomes irritation on repeat viewing**, and the owner will see this
  more than any visitor. *Mitigation:* keep it short; resist extending it; and
  accept replay rather than adding storage (Decision 3). If it genuinely grates,
  the correct fix is a shorter sequence, not a suppressed one.
- **Four motion systems can fight.** *Mitigation:* Decision 6's single-owner rule
  is a requirement with its own scenario, and every system shares one pace token.
- **An orchestrator is a single point of failure** for the whole page's
  visibility — more concentrated risk than per-component animation.
  *Mitigation:* the fail-visible requirement, verified by disabling JavaScript
  and by deliberately breaking the orchestrator during verification.
- **It could read as a loading screen**, which would be worse than no sequence:
  this site paints fast and static-first, and manufacturing delay to fill would
  invert the goal. *Mitigation:* no artificial wait states, no gating on fonts
  (Decision 2), and content interactive throughout (Decision 5).
