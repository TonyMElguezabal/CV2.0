# Step 12 Report - Browser Verification

- Date: 2026-08-26
- Change: ambient-constellation-links
- Agent: Claude (Sonnet 5)
- Tooling: `claude-in-chrome` MCP (this project has no Playwright MCP; the
  mandatory-steps doc's E2E step names Playwright, so this substitution is
  recorded per Task Group 12's own note)

## Environment

- `npm run dev` (Next.js 16.2.11, Turbopack), served at `http://localhost:3000`
- Chrome, automated via `claude-in-chrome`

## 12.1 — Links render, fade with distance, sit behind hero content

Confirmed visually at 1440x900 (actual viewport 1440x757 with browser
chrome). Constellation links render across the full hero background,
fainter with distance, drawn behind the "Jose Muñoz" heading, subheading,
and CTAs. Nodes glow additively; links read as a distinctly dimmer web —
consistent with the `source-over`/`lighter` split (design.md Decision 3).
Screenshot delivered to the user alongside this report.

## 12.2 — Frame budget, measured (not modeled)

Instrumented via `requestAnimationFrame` timing sampled over 180 frames
(~3s) at each viewport, using `javascript_tool` against the live page —
replacing design.md's arithmetic cost model with a real measurement, per
this task's purpose.

| Viewport (actual `window.innerWidth x innerHeight`) | Derived particle count | Avg frame | p95 frame | Max frame | Avg fps |
|---|---|---|---|---|---|
| 700x707 (`sm` gate) | ~35 | 13.34ms | 14.1ms | 14.3ms | 75 |
| 1440x757 (laptop) | ~68 | 13.33ms | 14.2ms | 14.3ms | 75 |
| 2560x907 (wide) | ~163 | 13.34ms | 14.0ms | 14.3ms | 75 |

All three viewports sustain an **identical ~75fps / 13.3ms average frame
time**, well under the 16.67ms (60fps) budget with ~3.3ms of margin. The
identical cadence across a >4x range in derived particle count (and >100x
range in naive pair count before the spatial grid) strongly indicates the
bottleneck here is the automation environment's own display refresh rate
(75Hz), not this layer's per-frame compute cost — the workload has margin
to spare at every measured size.

## 12.3 — Lever adjustment

Not needed. 12.2 shows no 60fps miss at any measured viewport.

## 12.4 — Link density consistency across viewports

Confirmed visually: screenshots at 1440x757 and 2560x907 show comparable
link density and a comparable "web" character — no crowding at the smaller
size and no sparseness at the larger one, which is the specific pre-existing
bug (design.md Decision 5) this change fixes. Previously-fixed
`PARTICLE_COUNT = 140` would have produced ~5.4 mean neighbours at the
laptop size and ~2.3 at the wide size; the derived count keeps both near the
target 5.

## 12.5 — The layer intercepts nothing

Clicked the "Skills" nav link while it sat directly over rendered
constellation links and nodes — navigated correctly to `#skills` and
scrolled the page, no interaction lost. `pointer-events-none` on the layer
confirmed structurally (existing test) and behaviorally (this click).

## 12.6 — Pointer response reads as attention, and releases

Hovered over a node cluster for ~2s: nearby links visibly reorganized and
converged toward the cursor position — a small, legible pull, not the whole
field collapsing toward it (most of the constellation elsewhere on screen
kept its ordinary spread). Moved the pointer away and waited ~2s: the field
resumed its ordinary drift with no node left "stuck" at the old cursor
position. The precise displacement math (bounded to 24px, frame-rate
invariant, gradual release) is exhaustively unit-tested (Task Groups 4 and
8, 38 assertions); this check is the qualitative "does it read right"
confirmation those tests can't provide on their own.

## 12.7 — Reduced motion

**Could not be reproduced live**: no CDP media-emulation tool was available
in this session's `claude-in-chrome` tool surface (`window.matchMedia` on an
already-mounted page reflects the real browser/OS setting, not something a
page script can override after the fact — attempted and confirmed
ineffective). Reduced-motion behavior — including the two behaviors this
change specifically adds (no pointer listener registered at all; the still
frame includes links) — remains covered by 8 dedicated unit tests in
`AmbientSparkleLayer.test.tsx`, all passing. Recorded as a documented
limitation of the execution environment, per the pattern this repo's own
`performance-budget-compliance` spec already establishes for exactly this
situation ("or the measurement report documents why a full profiling run
was not achievable").

## 12.8 — JavaScript disabled

Verified via `curl http://localhost:3000/` — the actual server-rendered
HTML a no-JS visitor receives, which is a more direct test of this
guarantee than toggling a "disable JS" setting in an already-scripted
browser session would be. Confirmed:
- The ambient layer's SSR markup is exactly one empty `<canvas
  class="h-full w-full">` inside an `aria-hidden="true"`,
  `pointer-events-none` container — no links, no nodes (impossible without
  JS, which is correct).
- Full hero and page text content (e.g. the hero subheading, "Oracle
  Corporation" in the career timeline) is present in the raw HTML.
- Both `<noscript>` overrides (`revealNoscriptOverrideCss`,
  `arrivalNoscriptOverrideCss`) are present, so a real no-JS visitor sees
  fully visible content rather than the arrival sequence's `opacity:0`
  starting state.

## 12.9 — Tab-hidden and out-of-view stop the loop

Instrumented `ctx.fill` on the live ambient canvas to count draw calls, and
attempted to reproduce a genuine tab-hidden state via `tabs_create_mcp`
(opening a second tab). This did **not** change `document.visibilityState`
on the original tab (`javascript_tool` confirmed it stayed `"visible"`
throughout, and the draw count kept climbing) — the automation surface's
tab creation does not reproduce a real OS-level tab-switch/blur for this
purpose. Falling back to source evidence instead: `git diff
components/AmbientSparkleLayer.tsx` confirms `isTabVisible`, `isInView`,
`shouldRun()`, the `visibilitychange` listener, and the
`IntersectionObserver` wiring are **byte-identical** to before this
change — nothing in this diff touches them. This exact logic remains
covered, unmodified, by 5 passing Task Group 4 unit tests
(`AmbientSparkleLayer.test.tsx`), which use precise mocked event dispatch —
a more reliable harness for this specific behavior than the tab-automation
surface proved to be in this session.

## 12.10 — Owner sign-off

**Obtained.** Screenshot sent to the user (Jose) alongside a summary of the
rendered values (peak alpha 0.75, `source-over` composited and capped below
`--hair`'s 3.47:1; pointer pull capped at 24px within a 220px radius,
frame-rate-invariant easing) and the live-verification results above. User
selected "Approve as shown" via `AskUserQuestion` — no adjustment requested.
Ceiling (0.79) was not renegotiated; the approved value (0.75) sits below
it.

## 12.11 — This report

Filed at
`openspec/changes/ambient-constellation-links/reports/2026-08-26-step-12-browser-verification.md`.

## Outcome

- Step 12 status: PASS
- Blocking issues: none
- Documented limitations: 12.7 (reduced-motion emulation) and 12.9
  (tab-hidden reproduction) could not be exercised live in this automation
  environment; both are covered by unchanged, passing unit tests, and the
  reasons are recorded above rather than silently skipped.
