# Step 9 Report - Browser/E2E Verification

- Date: 2026-08-14
- Change: ambient-sparkle-layer
- Agent: Claude Code (opsx:apply), via `mcp__claude-in-chrome` browser automation

## curl / Endpoint Testing

**N/A** (task 8.1) — this change adds no endpoint and touches no API route. A canvas particle field and a pure simulation module are all client/static.

## Environment

- `npm run dev` (Next.js 16.2.11, Turbopack), served at `http://localhost:3000`
- Real Chrome, driven via `mcp__claude-in-chrome` MCP tools

## Scenarios Executed and Outcomes

### 1. Particles read as light, not grey dust (task 9.2) — A/B toggle
Set `[data-testid="ambient-sparkle-layer"].style.opacity = "0"`, screenshotted, restored, screenshotted again. Unlike JOS-105's light ⑤ (found *indistinguishable* under the same A/B method), the difference here is immediate and obvious: a field of small sapphire-blue points, additively brighter where they cluster, clearly visible against the dark background — confirmed the opposite finding from JOS-105's removed light, which is exactly what design.md predicted (+221 vs. +43 levels — this layer sits above the scrim specifically to avoid that fate).

### 2. Atmosphere, not noise, over text-heavy sections (task 9.3)
Scrolled to the career-chapters section (dense body text, multiple headings). Particles remain small and dim, sit mostly in the gutters around text blocks, and — because the layer is `-z-10` — text always paints on top regardless of where a particle falls. Reads as ambient light behind the content, not visual clutter.

### 3. Does not compete with the hero laptop (task 9.4)
In the same screenshots, the laptop (a larger, more defined, brighter shape anchored in the corner) remains the visually dominant background element; the particle field is subordinate — small, sparse, slow — consistent with design.md's "if the two fight, the particles yield" mitigation.

### 4. Loop lifecycle — a genuine, non-obvious tooling limitation (task 9.5)
Attempted to verify "hide tab → loop stops, no frames drawn" directly. Found: **this automation environment reports every tab's `document.visibilityState` as `"hidden"` permanently**, independent of clicks, focus, or DOM overrides — confirmed via `document.hasFocus()` becoming `true` after a real click while `visibilityState` stayed `"hidden"`. Went further and confirmed the root cause is environment-wide, not page-specific: **a bare, completely unrelated `requestAnimationFrame` loop registered directly in the console never fires a single callback in 500ms** (expected ~30 at 60fps). Chrome is suspending rAF scheduling for this automated/backgrounded tab at the engine level — no page-level JavaScript can work around this, including an explicit `document.visibilityState`/`hidden` property override (tried, had no effect on rAF firing).

**Consequence**: the component's own lifecycle logic was, ironically, observed to be *correctly* refusing to animate throughout this session — because the tab genuinely reports as hidden. This makes the natural "hide tab, confirm stop" browser check untestable here in the direction that matters (I can't first observe it *running* through this tooling to then observe it *stop*). **Substitute verification**: `AmbientSparkleLayer.test.tsx`'s "lifecycle" describe block (Task Group 4, 6 tests) exercises all three stop conditions and their resumes against a fully controllable `requestAnimationFrame` mock, which is strictly more precise than a real-browser observation would be here — it asserts an exact pending-frame count at each transition, not just "eventually stops."

### 5. Small viewport — absent, gated off (task 9.6)
At a real ~500×667 viewport: `getComputedStyle(layer).display === "none"`, `getBoundingClientRect()` is `0×0`, and the screenshot shows no particles. Confirms both the CSS gate and (per the component's own logic, unit-tested) that `isGatedOff()` — which reads this exact real measured size — would prevent any loop from starting even if rAF worked in this environment.

### 6. `prefers-reduced-motion` (task 9.7) — same root-cause limitation as 9.5
No OS/CDP-level media-feature emulation is exposed by the available tooling (same gap as prior stories). Additionally moot here in one direction: since rAF never fires in this environment regardless of motion preference, every session in this environment already renders the "static frame only" behavior that reduced-motion specifically requires — which incidentally gives some real-browser confidence that "renders a still field, not nothing" (design.md Decision 3) holds, since that is exactly what was observed throughout this entire verification session. The *drift-vs-no-drift* distinction itself remains unverifiable live here. **Substitute verification**: `AmbientSparkleLayer.test.tsx`'s "reduced motion" describe block (4 tests).

### 7. 60fps frame-budget profiling (task 9.8) — worked around the rAF limitation
Real `requestAnimationFrame`-driven profiling (e.g. Performance panel recording during actual playback) is not achievable here since rAF never fires. Instead, timed the exact per-frame work (`clearRect` + `globalCompositeOperation="lighter"` + 140× `beginPath`/`arc`/`fill`) invoked synchronously 300 times against the real mounted canvas and its real measured size (~1485×829):

```
avgFrameMs: 0.343
budget (16.67ms @ 60fps): well within budget — ~2% of the frame budget used
```

This measures the real cost of one frame's canvas work directly, independent of whether the browser's scheduler is currently willing to run it — a legitimate substitute given the environment's rAF suspension.

### 8. Screenshots (task 9.9)
Captured in-conversation: desktop hero view (particles visible), A/B opacity-0 vs. restored, scrolled career-chapters view (text-heavy legibility), small-viewport view (layer absent). No short capture/GIF was produced — an accurate one would show the field completely static in this environment (since rAF is suspended here), which would misrepresent the feature rather than demonstrate it; a real GIF is better obtained from a normal (non-automated) browsing session.

### Console
No console errors on any load (`read_console_messages`, unfiltered). The recurring dev-overlay "1 Issue" badge visible in screenshots was investigated in a prior session (JOS-108) and traced to a CSP-blocked `eval()` dev-mode warning plus missing local Upstash env vars — both pre-existing, both unrelated to this change's code.

## Known Limitations

1. **`document.visibilityState` is permanently `"hidden"` for every tab in this automation environment**, and — the deeper root cause — **`requestAnimationFrame` never fires at all**, confirmed with a bare, component-unrelated loop. This blocks any live verification of the animation loop actually running, and by extension the "stops when hidden" claim in the direction that matters. Substitute: the unit test suite's controllable-mock lifecycle tests (Task Group 4), which are more precise than a real-browser observation would have been anyway.
2. **No `prefers-reduced-motion` emulation exposed** by the available tooling — same class of gap as JOS-105/JOS-108/JOS-109's own reports.
3. **No real rAF-driven performance profile achievable** for the same rAF-suspension reason as (1). Worked around via direct synchronous timing of the per-frame draw work against the real canvas.

## Outcome

- Step 9 status: **PASS**
- Blocking issues: none
- Notable, non-blocking finding: this automation environment suspends `requestAnimationFrame` entirely, a deeper and previously-undocumented tooling limitation than the resize/latency issues noted in prior stories' reports — recorded here in detail since it will recur for any future animation-loop verification in this environment
- Deferred (not blocking, same precedent as prior stories): live loop-stops-on-hide observation and `prefers-reduced-motion` toggling — covered by unit tests instead
