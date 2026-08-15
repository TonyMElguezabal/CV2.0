# Step 12 Report - Browser/E2E Verification

- Date: 2026-08-14
- Change: editorial-frame
- Agent: Claude Code (opsx:apply), via `mcp__claude-in-chrome` browser automation

## curl / Endpoint Testing

**N/A** (task 11.1) — this change adds no endpoint and touches no API route. Header, grid overlay, section anchors, and the timeline restyle are all static DOM/CSS.

## Environment

- `npm run dev` (Next.js 16.2.11, Turbopack), served at `http://localhost:3000`
- Real Chrome, driven via `mcp__claude-in-chrome` MCP tools

## Scenarios Executed and Outcomes

### 1. Collision measurement (task 12.2) — `getBoundingClientRect()`
Measured header, timeline rail, hero `<h1>`, and the chat-widget trigger. JOS-105 shipped a 112px hero/timeline overlap that only surfaced via real measurement, not jsdom — same method applied here.

At the widths actually achieved (see Known Limitation below — 1546×948 desktop, 500×729 mobile):

| Element | top | bottom | left | right |
|---|---|---|---|---|
| `header` | 0 | **96** | 0 | full width |
| Timeline rail (desktop, fixed) | **147.75** | 800.25 | 16 | 176 |
| Hero `<h1>` | 346.5 (desktop) / 203.9 (mobile, post skip-link) | — | 224 | 827 |
| Chat trigger | 878 | 924 | 1369.6 | 1507 |

No overlap at any measured point: the timeline rail starts 51.75px below the header's bottom edge; the hero heading is 250px+ clear; the chat trigger sits in the opposite corner entirely. Confirmed at the one full-precision desktop width the tooling allowed (1546px) and at mobile width (500px, timeline not fixed there — see Scenario 5).

### 2. Anchor activation — all three families (tasks 3.3 / 12.3)
- **Header nav link** ("Skills"): click → scrolled to `#skills`, `skillsTop: 111.92` vs `headerBottom: 96` → **clear** (15.9px margin, consistent with the 112px `scroll-margin-top` vs. 96px real header height)
- **Timeline node** ("Tiempo Development"): click → scrolled to `#tiempo`, `targetTop: 111.83` vs `headerBottom: 96` → **clear**
- **Skip link** (`#main`): click → `mainTop: 0`, technically **not** clear of `headerBottom: 96` — see the dedicated finding below (Scenario 4), not a defect in practice

Screenshots confirmed each destination's heading fully visible below the header, not clipped.

### 3. Skip-link visibility over the header (tasks 4.3 / 12.4)
Focused `a[href="#main"]` directly (`.focus()`, since literal Tab-key simulation proved unreliable in this sandbox — see Known Limitation). Screenshot shows the "Skip to content" pill rendered clearly **in front of** the header, its focus outline overlapping and partially obscuring the "JOSE MUÑOZ" brand text behind it — the header does not stack above it. Confirms the `z-30` (header) vs. `focus:z-50` (skip link) design holds in real rendering, not just as a class-string assertion.

### 4. Finding: `#main`'s own top boundary is structurally unclearable — and that's fine in practice
Activating the skip link (`#main`) lands at `scrollY: 0`, so `<main>`'s top edge sits at `document` y=0 — behind the header's 0–96px band. This is real: `scroll-margin-top` cannot help here, because `<main>` is the literal first element in the document and the browser cannot scroll past y=0 to give it clearance. This is different in kind from the header-nav and timeline cases, which land mid-document where scroll-margin-top has room to act.

Checked whether this actually hides anything: at `scrollY: 0`, the hero's real content — the `<h1>` name — sits at `top: 203.9px` (mobile) / `346.5px` (desktop), 100px+ clear of the header regardless of viewport. This is a side effect of the hero's own `min-h-screen flex items-center justify-center` layout (pre-existing, not part of this change): the empty vertical space above the centered hero content is what's technically "under" the header, not any real content. **No visible or interactive content is ever obscured by activating the skip link.** Recorded here rather than silently claiming full clearance on all three families, since design.md/proposal.md name `#main` explicitly and the literal claim ("lands below the header") doesn't hold for this one target the way it does for the other two — the practical outcome (nothing important hidden) does.

### 5. Small viewport (tasks 8.3 / 12.5)
At 500×729 (see Known Limitation for why not exactly 375/390): header remains two-row, full height (729px > 480px compact-mode threshold, so full-size rows rendered), nav links (Career/Skills/Projects) all visible and correctly sized (no clipping, no horizontal scroll needed at this width), no overlap with the timeline (which drops out of `md:fixed` below 768px and renders in normal document flow instead, confirmed at `top: 1458`, well after the hero). Grid overlay's vertical hairlines coincide with the viewport edges at this width (since the `max-w-3xl` column has nothing to constrain against below 768px) — a genuine, minor observation: the column lines are barely distinguishable from the screen edge at narrow widths, but this does not reduce legibility (no text sits near them, and `--hair` is a subtle tone by design).

### 6. No-JS navigation (task 12.6)
Verified via source review rather than a live JS-disabled toggle (not exposed by the available browser tooling — see Known Limitation): `grep -n "onClick" SiteHeader.tsx CareerTimeline.tsx SkipToContentLink.tsx` returns no matches. Every nav link, timeline node, and the skip link is a plain `<a href="#...">` with no click handler intercepting default behavior — native browser fragment navigation, works identically with JavaScript disabled. Matches `CareerTimeline`'s own pre-existing, already-accepted "no-JS navigation" requirement.

### 7. `prefers-reduced-motion` (task 12.7) — same class of limitation as JOS-105/108
Unlike JOS-108's framer-motion-driven entrance (which reads `matchMedia` once at JS mount, so a live toggle after load has no effect), this change's only new motion is a pure-CSS `motion-safe:transition-colors` on the timeline marker — CSS media features are normally live/reactive, not JS-cached. However, the available browser tooling exposes no way to emulate `prefers-reduced-motion` at the OS/CDP level from page JavaScript, so a true live toggle still isn't achievable here either. **Substitute verification**: `components/CareerTimelineStyles.test.tsx` (Task Group 6.4) asserts the marker's only transition is gated behind `motion-safe:` (never an unconditional `transition`/`transition-*` utility) and that its active-state size change has no `transition-[...]`/`transition-all` pairing at all — a plain, un-animated property jump regardless of motion preference.

### 8. Screenshots (task 12.8)
Captured and saved: `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-lcDg0L/screenshot-1786750081659-0.jpg` (desktop, ~1546px, mid-scroll showing header + rail + grid + hero together). Additional in-conversation screenshots captured for mobile (500px), skip-link-focused state, and each anchor-activation destination.

### Console
No console errors on any load (checked via `read_console_messages` with `onlyErrors: true`). Two pre-existing, unrelated warnings observed in the dev server log — a `eval()` blocked by this sandbox's CSP (a React dev-mode debugging feature, never used in production) and missing `UPSTASH_REDIS_REST_URL`/`TOKEN` (local analytics-store env gap) — neither touches header/grid/timeline code and both predate this change.

## Known Limitations

1. **`resize_window` was unreliable on a tab already navigated/resized once.** The first resize call on a *fresh* tab worked (imprecisely, matching JOS-108's own documented experience — e.g. requesting 1280/1440/1920 all landed at the same 1546×948, and 400×850 landed at 500×729), but repeated resize calls on the *same* tab after an initial resize or navigation had no further effect at all (stuck at the first achieved size). Worked around by opening a fresh tab for each viewport tier needed (desktop, mobile) rather than resizing one tab repeatedly. As a result, only two real widths were exercised (~1546px and ~500px) instead of the requested 1280/1440/1920/375/390 — the two achieved widths still meaningfully span the mobile/desktop range, so the substance of tasks 12.2 and 12.5 was satisfied even though the specific requested numbers weren't hit.
2. **Literal Tab-key simulation didn't reliably move focus into the page** in this sandbox (first Tab press after navigation didn't appear to reach the skip link; a click into the page before Tab-ing changed which element had focus first, contaminating the "first focusable element" check). Worked around by calling `.focus()` directly on the skip link via JS to exercise the same `:focus` CSS state a real Tab press would trigger, which is sufficient to verify the visual stacking claim (task 4.3) — the *order* claim (skip link is DOM-first) is separately and directly covered by `skipLinkVisibility.test.tsx`'s unit test.
3. **No JS-disabled toggle or `prefers-reduced-motion` emulation is exposed** by the available browser tools. Both covered by substitute verification (source review for no-JS; unit test for reduced-motion), per the same precedent set in JOS-105/JOS-108's own Step 9/11 reports.

## Outcome

- Step 12 status: **PASS**
- Blocking issues: none
- Notable, non-blocking finding: `#main`'s own top boundary can't gain `scroll-margin-top` clearance (structural — it's the document's first element), but no real content is ever obscured because of the hero's own pre-existing vertical-centering layout (Scenario 4) — documented rather than silently glossed over
- Deferred (not blocking, same precedent as prior stories): live `prefers-reduced-motion` toggling and JS-disabled toggling in a real browser — covered by source review / unit tests instead
