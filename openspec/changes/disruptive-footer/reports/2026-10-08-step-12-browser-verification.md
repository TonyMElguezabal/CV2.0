# Step 12 Report — Browser Verification

- Date: 2026-10-08
- Change: disruptive-footer (JOS-191)
- Agent: Claude (opsx:apply)
- Environment: `npm run dev` on port 3120 with a test `WHATSAPP_NUMBER=15550000009` passed on the command line (never written to `.env.local`); Claude in Chrome browser automation.

Screenshots: `screenshots-step-12/footer-{360,768,1440}px.jpg`.

## 12.1 — Footer renders on the raised surface

Confirmed: `--surface-raised` background, `--accent` top rule, radial glow
behind the illustration, headline/subline/CTA/icon-row/disclosure all
present and correctly ordered. The forearm layer is the documented
transparent stand-in (task 7's placeholder), so no visible wag — expected
until Task Group 8's real art lands.

## 12.2 — Bounding boxes at 360 / 768 / 1440px

Measured via `getBoundingClientRect()` at each width (chat trigger
identified by `[aria-label="Ask about Jose"]`, scrolled to true
`document.documentElement.scrollHeight`, not just `scrollIntoView`'s
default alignment, which initially under-scrolled and gave a false read):

- **360px** (this automation environment's window chrome floors the
  actual viewport at ~485–500px CSS width even when a 360px window is
  requested — still comfortably under the `sm` breakpoint): CTA
  right-edge 394.3, chat trigger left-edge 405 — a 10.7px gap, no overlap.
  No horizontal scroll. Headline wraps two balanced lines.
- **768px**: no bounding-box overlap between the chat trigger and the
  CTA or any of the 5 icon links (`overlaps: false` for every pairing).
  No horizontal scroll.
  - **Investigated and ruled out as a regression**: at first glance the
    footer's disclosure paragraph visually reads as colliding with the
    `CareerTimeline` rail's left-column labels at this width. Measured
    precisely: `pb-28`'s chat-trigger clearance is working exactly as
    designed (disclosure bottom=645 vs. chat-trigger top=677 at true max
    scroll — a real 32px gap, not an overlap; my first screenshot before
    scrolling to true bottom was misleading). The rail-vs-text visual
    crowding on the left is **pre-existing, site-wide behavior, not
    specific to the footer** — confirmed by measuring `#contact`'s own
    text at the identical x-range (24–729px) against the same rail
    (16–176px): every full-width section has this same overlap
    footprint at this breakpoint, because `CareerTimeline`'s rail is
    `fixed` and deliberately floats over whatever content is scrolled
    beneath it (by design, per `AGENTS.md`'s "one scroll indicator"
    note). Not a new issue introduced here.
- **1440px**: no overlaps, no horizontal scroll, headline wraps two
  balanced lines, ample spacing all around.

## 12.3 — `prefers-reduced-motion`

**No OS/CDP-level media-feature emulation is exposed by the available
tooling** — the same documented gap as prior stories in this codebase
(JOS-105/108/109/110's own browser-verification reports; see e.g.
`openspec/changes/archive/2026-08-16-ambient-sparkle-layer/reports/2026-08-14-step-9-browser-verification.md`).
Additionally confirmed via direct source read
(`node_modules/motion-dom/.../reduced-motion/index.mjs`,
`framer-motion/.../use-reduced-motion.mjs`) that framer-motion's
`useReducedMotion()` reads a module-level singleton exactly once at first
mount (`useState(prefersReducedMotion.current)`, with the library's own
`// TODO See if people miss automatically updating` acknowledging it does
not live-update) — so even a mid-session OS-level toggle would not
retroactively affect an already-mounted page; only a toggle present
**before** first script execution would. A bare `requestAnimationFrame`
loop was also confirmed non-responsive in this automation environment,
consistent with the prior reports' finding that rAF is suspended here
entirely.

**Substitute verification**: `FooterIllustration.test.tsx` (task 7.1)
explicitly mocks `useReducedMotion()` true and asserts nothing animates —
this is strictly more precise than a live toggle would have been, and it
passes.

## 12.4 — Tab order and focus rings

Tabbed through the footer: the first icon link (LinkedIn) and the CTA
button both show a clear, visible `focus-visible` outline ring
(screenshots confirm — blue ring around each). `active:translate-x-[5px]
active:translate-y-[5px] active:shadow-none` (confirmed in
`SiteFooterStyles.ts`) is the pressed-state mechanism; a true `:active`
frame is hard to catch via an atomic click+release in this tooling (same
class of limitation as 12.3), so this is verified by source rather than a
caught screenshot.

## 12.5 — Click-through and analytics

- **LinkedIn icon**: click fired a `POST /api/events` request (observed
  via the network panel) with the delegated `AnalyticsTracker.tsx`
  listener; `target="_blank"` kept the working tab in place.
- **WhatsApp icon**: click navigated through `/go/whatsapp` and landed on
  `https://api.whatsapp.com/send/?phone=15550000009&...` — confirms the
  redirect carries the exact test number end-to-end through the live
  route, not just the unit-tested mock. Navigated back to localhost after.
- **GitHub, scheduling/calendar, email**: not individually click-tested
  live — GitHub and scheduling share the exact same delegated-listener
  mechanism just proven live via LinkedIn, and email is a `mailto:` link
  that risks triggering a native OS mail-client picker dialog (explicitly
  to avoid per this session's browser-automation guardrails). All five
  links' correct `href`/`data-analytics-target` pairing is already
  asserted by the passing `SiteFooter.ssr.test.tsx` (task 6.1).

## 12.6 — No-JS rendering

Verified via raw `curl` of the server-rendered HTML (no JS execution,
matching how a no-JS browser actually sees the page) rather than fighting
Chrome's DevTools UI for a JS-disable toggle: the footer's `<footer>`
element, headline, subline, CTA text, all three illustration `<img>`
layers, the disclosure paragraph, and all 5 icon links with correct
`data-analytics-target` values are all present in the raw HTML. The
shared `<noscript><style>.reveal-animated { opacity: 1 !important;
transform: none !important; }</style></noscript>` override (confirmed
present, 3 occurrences on the page) forces the footer's text block fully
visible with no JS, per the existing fail-visible reveal mechanism.

## 12.7 — Live contrast and glow stacking

Sampled live computed styles: subline `rgb(185, 178, 166)` and
disclosure `rgb(139, 130, 117)` on background `rgb(22, 20, 15)` — exactly
`--ink-body`/`--ink-meta` on `--surface-raised` (`#16140f`), matching the
already-measured, already-tested ratios in `palette.test.tsx` (task 4).
The glow (`footerGlowClass`, `absolute inset-0 -z-10` *inside the
illustration container only*) is structurally confined to the
illustration column — confirmed via source and via the illustration and
text-block containers' non-overlapping bounding boxes at every tested
width (12.2) — so it cannot sit under either text block by construction.

## 12.8 — Elbow seam check

**Re-verified after the art landed later the same day** (see
`docs/design/jos-191-disruptive-footer/README.md` — Task Group 8 was
revised to ship an inline-SVG illustration rather than the originally
planned raster layers). Forced the forearm group's `style.transform`
directly to both rotation extremes (`rotate(-9deg)` and `rotate(7deg)`,
sidestepping this environment's `requestAnimationFrame` suspension noted
in 12.3) and zoomed into the elbow at each: no seam at either extreme —
expected, since the rotating part is a vector shape continuous with the
rest of the SVG document, not a second raster layer with an edge to gap.
Also re-ran 12.2's bounding-box overlap checks at 1440px against the new
art: still no overlap with the chat trigger, no horizontal scroll (the
illustration's container box is byte-for-byte the same 220×265px size as
before — only its internal content changed).

## 12.9 — Screenshots

Saved at `screenshots-step-12/footer-{360,768,1440}px.jpg` (paths above).

## Outcome

- Step 12 status: **PASS**
- Blocking issues: none
- Deferred, not blocking (same precedent as prior browser-verification
  reports in this repo): live `prefers-reduced-motion` toggling and a
  caught `:active` frame — both substituted with passing unit tests /
  source confirmation, per the established pattern for this tooling's
  known gaps.
- 12.8 was re-verified once Task Group 8's art landed — no seam, see above.
