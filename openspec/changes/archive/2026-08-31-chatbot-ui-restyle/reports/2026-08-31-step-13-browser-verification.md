# Step 13 Report - Browser Verification

- Date: 2026-08-31
- Change: chatbot-ui-restyle (JOS-121)
- Agent: Claude (Opus 5)
- Tooling: `claude-in-chrome` MCP, dev server on `localhost:3000`

## 13.1 — Dev server + real browser

**Found and fixed the same stale-dev-server gotcha `executive-impact-surface` hit**: the dev server had been running since Task Group 1, before `npm run build` and `npx opennextjs-cloudflare build` were run for this task group. Every `/api/chat` request 500'd with `Failed to fetch retrieval index from Assets binding: 500 Internal Server Error`. Killed it (`lsof -ti:3000,3001 | xargs kill -9`) and started fresh — resolved immediately.

## 13.2 — Trigger renders as the bot icon; accessible name confirmed via the accessibility tree

Used the `find` tool (which reads the real accessibility tree, not visual inspection) against the live page: `ref_615: button "Ask about Jose"` — exact match. The trigger renders with no visible text, only the bot artwork (confirmed visually — a white 3D bot render on a filled sapphire disc), and its accessible name resolves correctly to "Ask about Jose" via the `aria-label`. This was the single most important check in this change, per the task's own framing, and it holds.

## 13.3 — Salute animation

**Initial false alarm, then confirmed correct.** First check: sampled `getComputedStyle(arm).transform` twice, 2 seconds apart via separate tool calls — got the identical matrix both times, and `element.getAnimations()` returned `[]`. This looked like a frozen animation. Investigated further with a single in-page loop sampling the transform 6 times at 600ms intervals: values changed continuously across all 6 samples (`none` → a sequence of distinct rotation matrices), proving the animation **is** genuinely running. The two earlier "identical" samples were coincidental — separate tool round-trips don't land at precise, controllable moments, and by chance both landed in the same phase of the repeating 4.5s cycle. `getAnimations()` returning `[]` is expected: framer-motion drives a keyframe-array animation like this one via requestAnimationFrame + inline style, not the native Web Animations API, so it was never going to show up there. Resolves Open Question 1 implicitly: the trigger itself uses only the static body render (`chat-bot-body-112.png`, no arm layer) — the panel is where the animated salute lives, which reads well at the ~120px panel size.

## 13.4 — Input border contrast

Measured live via `getComputedStyle`: `border-color: rgb(77, 130, 189)` = `#4D82BD`, exactly `--accent`. Computed the actual WCAG contrast ratio against the panel background (`#18181b`) using the same relative-luminance formula as the rest of this codebase: **4.4237:1** — matches the design's calculated 4.42:1 exactly. Visually, the border is now clearly perceptible against the panel, unlike the prior 1.70:1 `zinc-700`.

## 13.5 — Typing greeting

Confirmed visually across multiple screenshots: the greeting types in letter-by-letter, reaches its final form ("Hi! I'm Mar.IA, an AI assistant Jose built to answer questions about him. Here are a few examples — or just type your own question!") within a couple of seconds, and reads correctly — no garbled characters, no visible NBSP artifacts (those only exist in the `aria-hidden` layer's DOM text, not visually distinguishable from a normal space).

## 13.6 — Idle bubble

Temporarily shortened `MIN_DELAY_MS`/`MAX_DELAY_MS` in `useIdleInvitation.ts` from `60_000`/`300_000` to `3_000`/`5_000` to make the cadence observable, then restored the real values afterward (confirmed via `grep` post-restore — both back to `60_000`/`5 * 60_000`).

Found and worked around a real environment constraint while testing this: `document.visibilityState` reports `"hidden"` in this tooling's Chrome tab regardless of which tab is being actively driven — likely because the automated window isn't OS-foregrounded. Since the idle bubble's pause-on-hidden logic is working exactly as designed (matches `AmbientSparkleLayer`'s established pattern, and is unit-tested), this correctly prevented the bubble from ever appearing under real automated conditions. Forced `document.visibilityState` to `"visible"` and dispatched a synthetic `visibilitychange` event (the same override technique the unit tests use) to get a live observation — confirmed this is the tooling's limitation, not a product bug, since the same override made everything work immediately afterward.

With visibility forced and the interval shortened, the bubble appeared with the correct content: `"Hi! I am Mar.IAMaria✕"` in the DOM (the `aria-hidden` "Mar.IA" + `sr-only` "Maria" split, plus the dismiss control) and, visually, a clean bubble reading "Hi! I am Mar.IA ✕" with a sapphire border, positioned above the trigger.

## 13.7 — Focus safety

Created a temporary focus-probe button, focused it, then waited through the shortened idle interval. Confirmed via `document.activeElement.id === "focus-probe"` immediately after the bubble appeared: **true** — focus never moved. Repeated with `document.activeElement.tagName` before/after in the fresh-tab test: stayed on `BODY` throughout. The bubble never steals keyboard focus.

## 13.8 — Session suppression

Clicked the bubble's dismiss control — bubble disappeared, then reappeared shortly after (expected: the repeating cadence is independent of dismiss, per design). Opened the actual chat trigger; confirmed live via `sessionStorage.getItem("chat-widget-interacted")` → `"true"` immediately after. This matches the 8 passing `useIdleInvitation.test.tsx` unit tests exactly, now confirmed against a real browser's real `sessionStorage`, not a jsdom mock.

## 13.9 — Mobile / narrow viewport

`resize_window` again did not set the requested exact viewport (390×844) — same tooling limitation documented in the `executive-impact-surface` session. The achievable narrow width via the same fresh-tab-then-resize-then-navigate workaround was **500×701** again — consistent with that prior session's finding, below the site's 640px `sm:` breakpoint, so it exercises real mobile-width layout behavior.

At 500px: the trigger renders cleanly (screenshot: `2026-08-31-mobile-500-panel-open.jpg`). Opened the panel — it fits fully within the viewport with no horizontal overflow, the bot artwork is legibly sized, the greeting text wraps correctly, all 5 starter questions are visible and tappable, and the close button remains reachable. No layout breakage at this width.

## 13.10 — Reduced motion

Checked `window.matchMedia("(prefers-reduced-motion: reduce)").matches` live: returns the OS's actual setting (`false`), with no way to toggle it through this tooling — the same environment limitation already documented in the `executive-impact-surface` and `ambient-constellation-links` sessions (no CDP media-feature emulation exposed here). Documenting as an environment limitation, backed by the passing unit-test coverage: `ChatWidget.test.tsx`'s idle-bubble reduced-motion test, `ChatPanel.test.tsx`'s bot/greeting reduced-motion tests, and `ChatGreetingText.test.tsx`'s own reduced-motion tests all pass and cover this behavior directly.

## 13.11 — Screenshots

- `screenshots/2026-08-31-desktop-trigger-tooltip.jpg` — desktop, closed, tooltip hover-revealed (confirms the emoji is unchanged)
- `screenshots/2026-08-31-desktop-panel-open.jpg` — desktop, panel open, greeting fully typed, bot mid-salute, input border clearly visible
- `screenshots/2026-08-31-mobile-500-panel-open.jpg` — 500px width, panel open, no overflow

## Task 12 curl results (cross-referenced, not duplicated)

Full commands and responses are in the Step 11 report's companion — actually captured directly in `tasks.md` Task Group 12's entries, since these were pulled forward to double as the Step 11 grounding check:

- Identity question → self-identifies as Mar.IA correctly, third-person about Jose, cites `meta`
- Persona-adoption attempt → refuses and self-identifies in the same response
- Normal question about Jose → fully third-person, cites real chapters (`experience/oracle`, `faq`, `skill`, `experience/ibm`)

## Outcome

- Step 13 status: PASS
- Blocking issues: none
- Tooling notes for future sessions: (1) `resize_window` still does not reliably set exact viewport dimensions — the fresh-tab-then-resize-then-navigate workaround reliably achieves ~500×701, which is narrow enough to exercise real mobile breakpoints; (2) `document.visibilityState` reports `"hidden"` for automated tabs regardless of which is being driven — override it directly (same technique the unit tests use) when live-testing any visibility-gated behavior; (3) rapid two-sample comparisons of a CSS animation's computed style across separate tool round-trips can produce false "frozen" readings if both samples land in the same phase of a repeating cycle — sample several times in one in-page loop instead of relying on separate tool calls with real-world timing gaps.
