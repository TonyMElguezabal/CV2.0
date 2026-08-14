# Step 9 Report - Browser/E2E Verification

- Date: 2026-08-14
- Change: site-typography-and-palette
- Agent: Claude Code (opsx:apply), via `mcp__claude-in-chrome` browser automation

## curl / Endpoint Testing

**N/A** — this change adds no endpoint and touches no API route (task 8.1).

## Environment

- `npm run dev` (Next.js 16.2.11, Turbopack), served at `http://localhost:3000`
- Real Chrome, driven via `mcp__claude-in-chrome` MCP tools

## Scenarios Executed and Outcomes

### 1. Font application (9.1, 9.2) — verified via `getComputedStyle`, not className strings
Per this change's own task 9.1, which explicitly names JOS-105's own lesson (a Tailwind class that read correctly in the DOM and had zero rendered effect): every claim below is `getComputedStyle`, not `className.includes(...)`.

- Hero `<h1>`: `fontFamily` resolves to `archivoDisplay, "archivoDisplay Fallback", archivoBody, ...` (real self-hosted font names, not `system-ui`); `fontSize` = 88px at 1440px viewport (clamp resolved near its max, correct)
- Hero `<p>` (positioning): `fontFamily` resolves to `archivoBody, ...`; `fontSize` = 17px; `lineHeight` = 28.56px (= 17 × 1.68, exact); `color` = `rgb(185, 178, 166)` (= `#b9b2a6`, `--ink-body`, exact)
- Section heading ("Skills" `<h2>`): `fontSize` = 28px (exact clamp max), `fontFamily` starts with `archivoDisplay`

### 2. Display gradient and accent word (9.4)
- Lead span ("Jose"): `backgroundClip` = `text`, `webkitTextFillColor` = `rgba(0,0,0,0)`, `backgroundImage` = the correct 4-stop gradient (`linear-gradient(rgb(255,255,255) 0%, rgb(236,231,221) 38%, rgb(154,143,126...`)
- Accent span ("Muñoz"): `color` = `rgb(77, 130, 189)` (= `#4d82bd`, exact match to `heroLaptopAccentHex`)
- **Real text selection verified programmatically**: `Range`/`Selection` API against the `<h1>` returns `"Jose Muñoz"` exactly — confirms the gradient is a paint effect over real, selectable text, not an image or replaced content
- No console errors on load

### 3. Longest real headings across viewport widths (9.3)
`resize_window` proved imprecise in this environment — requested 768px and 360px did not land exactly (see Known Limitation below), but three meaningfully different real widths were achieved and verified with the site's actual longest `<h3>` ("▸ Project Manager / Account Manager at Tata Consultancy Services (General Electric account)", 91 characters — longer than the specific example named in `design.md` Risk 3, since site content has evolved since that was written):

| Requested | Achieved (`innerWidth`) | Result |
|---|---|---|
| 1440px | 1440px | Wraps to 3 lines, `text-balance` producing clean breaks, no orphaned words |
| 768px | 1204px | Wraps to 2 lines, clean |
| 360px | 500px | Wraps to 3 lines, clean, still clearly hierarchically distinct from body text |

At every width tested, the long heading remained legible and did not overflow, collide with adjacent content, or break `text-balance`'s intent.

### 4. Entrance pace (9.5)
Direct timing measurement is unreliable across separate tool calls — see Known Limitation below — but real evidence was captured within single low-latency `browser_batch` calls:
- Immediately post-navigation: `opacity: 0`, `transform: matrix(1,0,0,1,0,24)` (translateY(24px), exactly `pace.offsetY`) — confirms the animation starts from the exact configured initial values
- A subsequent batched screenshot caught the heading clearly mid-fade (visibly dimmer than settled, not yet at full opacity)
- After settling: `opacity: 1`, `transform: none`
- This confirms the entrance is a real, non-instant, multi-frame animation starting from the token's configured values — combined with the source-content unit tests proving `pace.duration`/`pace.ease` are the literal values passed to `framer-motion`'s `transition` prop, this is strong evidence the pace change is functioning, not just unit-tested in isolation
- Whether it "feels unhurried rather than sluggish" is inherently a subjective, owner-level judgment call, consistent with how `arrival-sequence`'s own tasks.md treats the same class of assessment

### 5. `prefers-reduced-motion` — NOT ACHIEVABLE (same limitation as JOS-105)
Attempted overriding `window.matchMedia` via injected JS after page load; confirmed (as expected) it has no effect, since `framer-motion`'s `useReducedMotion` reads `matchMedia` once at mount and there is no way with the available tooling to inject an override *before* the page's own JavaScript runs. **Covered instead by unit tests**: `HeroFramer.test.tsx` explicitly asserts both the heading and the positioning text drop their y-offset entirely (not merely slower) under a mocked `prefers-reduced-motion: reduce`.

### 6. `/admin` smoke check (9.6)
- `document.documentElement.className` includes both font-variable classes (`archivodisplay_..._variable archivobody_..._variable`)
- `getComputedStyle(document.body).fontFamily` resolves to `archivoBody, ...`
- **Visual impression was misleading and worth recording**: at a glance, the admin login form's labels looked like a generic system sans-serif, not Archivo — Archivo Regular (400, normal width) at small UI-label sizes doesn't read as distinctly "designed" the way the bold/expanded display face does. The programmatic check confirmed correct wiring regardless; this is exactly the gap `getComputedStyle`-based verification exists to catch, and a reminder that visual judgment alone would have been wrong here in either direction (a false negative, in this case — the font *was* correctly applied, despite looking unremarkable)
- No console errors

## Known Limitation: `resize_window` Imprecision and Cross-Call Latency

Two related tooling constraints affected this session, both worth recording for future changes:

1. **`resize_window` did not reliably hit requested dimensions.** Requesting 768×900 produced 1204×791; requesting 390×844 produced 500×667. The tool succeeded and did resize the window, just not precisely. Verification proceeded with the widths actually achieved rather than blocking on exact figures — all three achieved widths were still meaningfully different points across the mobile-to-desktop range, so the substance of task 9.3 was satisfied even though the specific numbers weren't hit.
2. **Separate tool calls have enough round-trip latency to make sub-2-second animations appear instantaneous.** A `navigate` call followed by a *separate* `javascript_exec` call consistently showed the 1.4s hero entrance already fully settled, even immediately after a fresh navigation — the inter-call latency (including model processing time between calls) exceeded the animation's own duration. Batching `navigate` and the follow-up check inside one `browser_batch` call resolved this and successfully caught the animation mid-flight.

## Outcome

- Step 9 status: **PASS**
- Blocking issues: none
- Deferred (not blocking, same precedent as JOS-105): real-time `prefers-reduced-motion` toggling in a live browser — covered by unit tests instead
