# Step 9 — Browser Verification

**Change:** scroll-reveal-motion (JOS-111)
**Branch:** `feature/scroll-reveal-motion`
**Date:** 2026-08-14
**Driver:** Claude in Chrome, against `npm run dev` on `http://localhost:3000`

## 9.1 Dev server + real browser

Started `npm run dev`, confirmed `200` on `/`, drove the page with Claude in
Chrome throughout this step.

## 9.2 / 3.5 — Copy a revealed heading, confirm it appears once

**Found a real defect, fixed it, then re-verified.**

Manual drag-selection worked correctly from the start: selecting across
"Skills" by dragging and reading `window.getSelection().toString()` returned
exactly `"Skills"` — the `select-none` ghost mechanism built in Task Group 3
does what it's supposed to.

But double-click and triple-click — the far more common way to select a short
word — did not: double-clicking "Skills" selected only `"Sk"`; double-clicking
"Contact" selected only `"Con"`. Isolated the cause directly on the live page
by selectively toggling styles via `javascript_tool`:

1. Changing the per-character wrapper's `display` from `inline-block` to
   `inline` did **not** fix it (still `"Sk"`) — ruled out `inline-block` as
   the cause.
2. Hiding the ghost spans entirely (`display: none`) **did** fix it (full
   `"Skills"` selected) — isolated the ghost's presence as sibling of the
   sharp copy, inside the same tiny per-character box, as the cause.
3. Re-stacking ghost+sharp via CSS Grid instead of `position: absolute`
   (still co-located in the same per-character box) did **not** fix it
   (selection collapsed further, to a single character) — ruled out
   `position: absolute` specifically; the co-location itself was the cause.
4. Moving all ghost characters into one separate, absolutely-positioned
   overlay layer — entirely outside the sharp copy's per-character DOM —
   **did** fix it (full `"Skills"` selected, visual cross-fade unchanged).

Implemented this as the real fix in `components/RevealHeading.tsx` (see
design.md Decision 1/4's amendments and tasks.md 2.2/2.3/3.5 for the full
account). Re-verified after the fix, in the real browser, on all three
revealed headings:

| Heading | Double/triple-click selection | Real clipboard paste (`Cmd+C` → `Cmd+V` into a live `<input>`) |
|---|---|---|
| Skills | `"Skills"` (full) | — |
| Projects | `"Projects"` (full) | — |
| Contact | `"Contact"` (full) | `"Contact"` (exact, no duplication, no stray whitespace) |

Also re-ran the full unit suite (`npx vitest run --no-file-parallelism`,
`npx tsc --noEmit`) after the fix: **501/501 passing**, clean types. Added a
new regression test (`RevealHeading.test.tsx`: "never nests a ghost character
inside a sharp character's own wrapper") asserting the DOM shape that caused
this can't silently recur.

## 9.3 Scroll the full document

Scrolled from hero through Career → Skills → Projects → Contact. Every
section revealed as expected; caught the "Skills" and "Projects" headings
mid cross-fade (visible blur-to-sharp transition) and confirmed both settle
cleanly. Nothing was left blank anywhere in the document, including at the
very bottom (Contact links + footer privacy note).

## 9.4 Fail-visible path

- **Deep-link reload** to `http://localhost:3000/#contact`: page jumps
  straight to Contact, heading and links fully readable immediately, no
  blank gap while observers spin up.
- **Rapid navigation before observers settle**: pressed `End` immediately on
  a fresh page load (no time for scroll-based reveals to fire naturally).
  Screenshot caught the Contact heading mid cross-fade (still resolving) but
  every word of substantive content underneath was already fully readable —
  confirms the fail-visible guarantee: the reveal is a cosmetic overlay on
  top of content that's already there, never a gate the content waits on.

## 9.5 In-page find on unscrolled text

Chrome's native find-bar UI isn't part of the page DOM and isn't reliably
capturable through this tool's screenshot/DOM inspection, so verified the
same underlying guarantee find relies on directly: immediately after a fresh
page load, at `scrollY: 0`, before any section had come into view —

```js
document.body.textContent.includes('Book a meeting')       // true
document.body.textContent.includes('Replaced a manual …')  // true
document.body.textContent.includes('Skills')                // true
```

All present in the rendered DOM before any scrolling — exactly what
in-page find operates against. Content is never conditionally removed
pending a reveal; only `opacity`/`transform` are ever animated.

## 9.6 JavaScript disabled

No toggle to disable JS was available in this tool session, so verified the
closest real equivalent: raw `curl` of the SSR HTML (byte-for-byte what any
no-JS browser receives) —

```
<noscript><style>.reveal-animated { opacity: 1 !important; transform: none !important; } .reveal-ghost { opacity: 0 !important; }</style></noscript>
```

confirmed present, alongside SSR output that genuinely bakes the *default*
hidden state (`style="opacity:0;transform:translateY(24px)"`) into the
markup. The `<noscript>` override is guaranteed by spec to activate whenever
scripting is disabled, in any browser — this is the same mechanism already
covered by `SectionReveal.ssr.test.tsx`, confirmed here against the real
server output rather than a test harness.

## 9.7 Cross-fade visual quality

Confirmed via zoomed screenshots at multiple points in this session — the
blur-up reads as intended (a blurred ghost dissolving under a sharpening
copy, not a crossfade artifact) on all three headings, both before and after
the Task Group 9 structural fix (the fix only changed DOM shape, not the
visual construction). No need to stop and report on visual quality — it did
not disappoint.

## 9.8 Reduced motion in a real browser

No devtools-level "emulate `prefers-reduced-motion`" toggle was available in
this tool session. Documented as a tooling limitation, same precedent as
JOS-105's Step 11 report — substitute coverage is the reduced-motion unit
tests in `SectionReveal.test.tsx` and `RevealHeading.test.tsx` (Task Group
5), including the "reaches its fully visible final state" tests added this
session, which directly assert opacity settles to `1` and no `y`-offset is
ever rendered under `prefers-reduced-motion: reduce`.

## 9.9 60fps profiling

No devtools Performance-panel capture was available in this tool session.
Documented as a tooling limitation. Structural substitute: the unit test
"only animates opacity and transform on the sharp/ghost/wrapper spans —
never any other property" (`RevealHeading.test.tsx`) asserts no other CSS
property is ever set inline by the motion components, which is the
precondition for compositor-only (GPU) animation; `filter` (the blur) is a
static, never-animated class per design.md Decision 1.

## 9.10 Screenshots / capture

Multiple screenshots captured throughout this session, including the
settled hero state and mid-transition cross-fades on the Skills and Projects
headings. Saved one to disk:
`/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-lcDg0L/screenshot-1786769219613-1.jpg`

## Curl N/A rationale (Task Group 8)

No endpoint or API route is touched by this change — it is entirely
client-side (React components + CSS/motion). `curl` was still used in 9.6
above, but as a way to inspect raw SSR HTML, not to test an endpoint
contract.

## Summary

| Task | Result |
|---|---|
| 9.2 / 3.5 Copy-paste | Real defect found (word-selection), fixed, re-verified on all 3 headings |
| 9.3 Full scroll | All sections reveal, nothing left blank |
| 9.4 Fail-visible | Deep-link + rapid-navigation both confirm content never gated |
| 9.5 In-page find | Content proven present in DOM before any scroll |
| 9.6 No-JS | `<noscript>` override confirmed in real SSR output |
| 9.7 Visual quality | Cross-fade reads correctly, no stop-and-report needed |
| 9.8 Reduced motion | Tooling limitation — substitute unit coverage documented |
| 9.9 60fps profiling | Tooling limitation — structural substitute documented |
| 9.10 Capture | Screenshots taken, one saved to disk |
