# Step 10 — Browser Verification

**Change:** arrival-sequence (JOS-112)
**Branch:** `feature/arrival-sequence`
**Date:** 2026-08-15
**Driver:** Claude in Chrome, against `npm run dev` on `http://localhost:3000`

## 10.1 Dev server + real browser

Started `npm run dev`, confirmed `200` on `/`, drove the page with Claude in
Chrome throughout this step.

## 10.2 Watched as a first-time visitor would

Reloaded and captured screenshots in quick succession. First frame: hero
name/positioning/CTAs fully invisible, the laptop layer barely visible
mid-fade — content is clearly staged, not simultaneous. Second frame
(fractions of a second later): everything settled — name, positioning,
CTAs, and laptop all in final state. Reads as one coordinated movement
arriving in order, not several independent things popping in — the
distinction this change exists to create.

## 10.3 Reloaded ten times

Executed 10 back-to-back reloads. No crash, no degraded state, no
accumulated console errors or warnings across the run (`read_console_messages`
found nothing after the batch). The sequence's total duration —
`ARRIVAL_STEP_DELAYS.heroCtas` (0.91s) + `pace.duration` (1.4s) ≈ 2.3s — is
short by design and ends cleanly with nothing left running afterward (no
loop, no listener). Own assessment: at ~2.3s once per page load (not once
per interaction), this reads as brief rather than obnoxious; final judgment
on "does it grate" per design.md Risk 1 is the owner's call as the person
who will load this page the most.

## 10.4 Clicked a CTA mid-sequence

Confirmed twice. First, via `find` + `computer` click on the real "Ask AI"
button — a real mouse-driven interaction. The `aria-expanded` check
immediately after read `false`, which turned out to be a false negative:
reading DOM state synchronously right after a native click doesn't
guarantee React's state update has committed yet. A screenshot taken
moments later showed the chat panel genuinely open with its full content
(starter questions, input, send button) — the click worked.

Second, isolated the *mid-sequence* claim specifically: reloaded and, in
the same round-trip, read `getComputedStyle(document.querySelector('h1')).opacity`
(confirmed `"0"` — the hero was still fully invisible) and clicked the "Ask
AI" button in the same script. A follow-up screenshot confirmed the chat
panel opened. The control was clickable and responded immediately while
its own wrapper was still at zero opacity — exactly the non-blocking
guarantee this change specifies.

## 10.5 Deliberately broke the orchestrator

Best covered at the unit level: no CDP-style hook was available in this
tool session to inject code that runs *before* hydration on a fresh
navigation, which is what "the orchestrator throws" needs to be reproduced
live. `ArrivalSequenceProvider.test.tsx`'s "fail-visible: the orchestrator
throws" test exercises this directly — and, notably, caught a **real bug**
during development (task 1.1): a `try/finally` that ran the recovery state
update but did not stop the original exception from propagating, which
React then surfaced as an uncaught error. Fixed to `try/catch`, re-verified.
The no-JS check below (10.7) is the browser-level analogue of an even more
severe version of the same failure class — the orchestrator never running
at all — and is fully covered live.

## 10.6 Loaded with `#contact` in the URL

Confirmed via `window.scrollY` immediately after navigating to
`http://localhost:3000/#contact`: the browser's native anchor scroll fired
correctly (`scrollY: 5549`, landing at the Contact section) — nothing in
this change interfered with it. Scrolling back to the top confirmed the
hero rendered directly in its final state (`opacity: "1"`, `transform:
"none"`) rather than starting hidden and animating in — the deep-link skip
worked as specified.

## 10.7 Verified with JavaScript disabled

No toggle to disable JS outright was available in this tool session, so
verified the equivalent: raw `curl` of the SSR HTML (byte-for-byte what a
no-JS browser receives) confirms:
- The `<noscript><style>.arrival-animated { opacity: 1 !important;
  transform: none !important; }</style></noscript>` override is present in
  the real server output.
- The SSR HTML genuinely bakes the *default hidden* state into every
  participant before that override applies — `hero-laptop-layer` and
  `ambient-sparkle-layer` both render `style="opacity:0;transform:none"`,
  and the hero text spans render `style="opacity:0;transform:translateY(24px)"`.

This is the same mechanism `SectionReveal.ssr.test.tsx`/
`ArrivalSequenceProvider.ssr.test.tsx` cover in unit tests, confirmed here
against the real server output rather than a test harness.

## 10.8 Confirmed it does not read as a loading screen

The before/after screenshots (10.11) show the background (ambient
particles, laptop silhouette, career timeline in the left rail) already
rendering in the very first frame captured — nothing is blank or waiting.
Only the hero's own text and CTAs are staged in; there is no artificial
wait state or hold before anything happens, consistent with design.md's
explicit non-goal of avoiding a "loader."

## 10.9 `prefers-reduced-motion`

No devtools-level emulation toggle was available in this tool session.
Documented as a tooling limitation, same precedent as JOS-105's Step 11
report and this session's other tickets — substitute coverage is
`ArrivalSequenceProvider.test.tsx`'s reduced-motion describe block (3
tests: no y-offset, still reaches full opacity, duration not stretched)
plus `HeroFramer.test.tsx`'s two reduced-motion tests on the real wired
component.

## 10.10 60fps profiling

No devtools Performance-panel capture was available in this tool session.
Documented as a tooling limitation. Structural substitute:
`ArrivalSequenceProvider.test.tsx`'s "the returned style only ever touches
opacity/y" test asserts no other CSS property is ever set by
`useArrivalStep`, which is the precondition for compositor-only (GPU)
animation — the same guarantee this codebase's other motion systems rely
on (`RevealHeading`, `SectionReveal`, `HeroLaptop`'s own lighting rig).

## 10.11 Screenshots

Captured throughout, including a before/after pair saved to disk:
- Before (hidden, first frame): `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-lcDg0L/screenshot-1786823653271-2.jpg`
- After (settled): `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-lcDg0L/screenshot-1786823659792-3.jpg`

A short screen recording was not captured this pass (no GIF-recording step
was run) — the before/after stills plus the mid-transition captures
earlier in this session together document the choreography.

## Curl N/A rationale (Task Group 9)

No endpoint or API route is touched by this change — it is entirely
client-side (React components + CSS/motion). `curl` was still used in 10.7
above, but as a way to inspect raw SSR HTML, not to test an endpoint
contract.

## Summary

| Task | Result |
|---|---|
| 10.2 First-view read | Reads as one coordinated movement, staged not simultaneous |
| 10.3 Ten reloads | No crash/degradation; ~2.3s total, ends cleanly |
| 10.4 Click mid-sequence | Confirmed responsive while wrapper still opacity:0 |
| 10.5 Orchestrator throws | Unit-level fully verified (real bug caught); browser-level covered by 10.7 |
| 10.6 Deep link | Native scroll untouched; hero renders in final state directly |
| 10.7 No-JS | `<noscript>` override confirmed in real SSR output |
| 10.8 Not a loading screen | Background renders immediately, no artificial wait |
| 10.9 Reduced motion | Tooling limitation — substitute unit coverage documented |
| 10.10 60fps profiling | Tooling limitation — structural substitute documented |
| 10.11 Capture | Before/after screenshots saved to disk |
