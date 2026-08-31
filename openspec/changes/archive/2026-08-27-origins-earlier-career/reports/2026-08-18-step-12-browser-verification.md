# Step 12 Report - Browser Verification

- Date: 2026-08-18
- Change: origins-earlier-career
- Agent: Claude Code

## Environment
- Dev server: `npm run dev` (Next.js 16.2.11, Turbopack), `http://localhost:3000`
- Browser: Claude in Chrome, real browser automation (not headless snapshot testing)

## Step 11 curl Results (documented here per task 11.3)

**Command 1** — reaching the origins span:
```
curl -s -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"How long has Jose been in technology?"}'
```
Answer (reassembled from SSE tokens): *"Based on the provided context, Jose
has been building, teaching, and selling technology since he was 13. The
context also notes this "Origins" period as 1994–2006, but it doesn't give
enough detail to calculate an exact total number of years from that
alone."* — reaches 1994 explicitly. A repeat call with identical wording
answered "since he was 13" without stating the year — consistent with the
phrasing non-determinism found and fixed for `factual-21` in Task Group 10
(the year is reliably groundable; it isn't always the model's default
phrasing for an open-ended "how long" question, which is exactly why Task
Group 10's eval question was reworded to ask for the year specifically).

**Command 2** — era-disambiguation:
```
curl -s -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What is Jose'"'"'s cloud experience?"}'
```
Answer: *"Jose has cloud experience through leading complex technical
programs and platform delivery, including cloud initiatives at Oracle. The
context specifically mentions Oracle Cloud Infrastructure (OCI) and OCI
AI/LLM Services..."* — no 1990s tooling (Novell, HP-UX, Windows 95, Clipper)
appears.

## Rail Fit — Real Finding, Not Just Verification

Design.md's Risks section flagged "8 nodes ≈ 745px in a 779px viewport... it
fits, but the margin is now thin. Verify in a real browser." Real-browser
verification found this understated the problem: at 779px, the rail's
topmost node ("Oracle Corporation") was visually obscured behind
`SiteHeader`'s fixed band, its company-name label nearly invisible under
the "CAREER / SKILLS / PROJECTS" nav row (screenshot: zoomed crop of the
top-left region clearly shows only a stray dot and the date range peeking
out, no label).

Measured via injected JS rather than guesswork: real rail height 721px
(design.md's 745px was an estimate), header height 96px exactly (`h-14` +
`h-10`), collision ≈ 67px at 779px viewport height.

Presented the finding and two options to the user (fix now vs. document as
a known limitation) rather than deciding unilaterally, since it's a
layout-affecting CSS change. User chose to fix it now.

**Fix**: `components/CareerTimelineStyles.ts`'s `timelineNavClass` —
`md:top-1/2` → `md:top-[calc(50%+3rem)]`, shifting the rail's vertical
centering point down by half the header height so it centers in the space
below the header rather than the full viewport. See design.md Decision 9
for the full writeup, including the honest residual: the fix reduces the
779px-viewport collision from ~67px to ~19px and eliminates it entirely at
viewport heights ≥ 817px, but doesn't achieve zero collision at every
possible height, because the rail's content (721px) exceeds the space
available below the header (683px) at exactly 779px. Full elimination at
all heights needs a containment strategy (max-height + internal scroll, or
reduced spacing) — work design.md's Risks section had already scoped as
required for "the next addition to the rail... regardless of this change."

Verified post-fix: all 8 nodes visible with clean header clearance at
realistic viewport heights (~830px+, the heights this browser session could
reliably reproduce); `npx vitest run components/CareerTimeline
components/oneScrollIndicator` — 22/22 pass, confirming the positioning
change didn't touch the observer/`aria-current`/keyboard mechanism (Task
Group 5's guarantee holds).

## Origins Node Navigation

- Clicked the "Origins" rail node: URL updated to `#origins`, page scrolled
  to the section, heading fully visible below the header (the universal
  `[id] { scroll-margin-top: 7rem }` rule applies automatically, no
  per-anchor change needed).
- Confirmed via injected JS: exactly one `[aria-current="location"]`
  element in the entire DOM, pointing to `#origins` — no second scroll
  indicator introduced.

## Section Read (Critical Read, Not Just Presence Check)

Read the full rendered `OriginsSection` in the browser, scrolling through
both beats. Assessment: **reads as a differentiator, not padding.**
- The CALCOM/Norton Ghost story lands with specific, verifiable weight: a
  named customer order (300 machines), a named tool (Norton Ghost), and an
  organizational outcome ("adopted across every CALCOM branch and office").
- INEGI's closing line — "still in production twenty years later, in 2026"
  — is the kind of detail that survives a skeptical read.
- The two-beat structure (self-taught years → formal years) gives the
  "credential came after the practice" arc real shape instead of a flat
  list.
- No entries read as filler; no cuts made (per design.md Risks' own
  instruction to cut rather than soften if this read as padding — it didn't).

## Chat Widget

Opened the chat widget via its floating button, asked "What did Jose do
before his career at IBM in 2006?" through the real UI (not curl). Answer
correctly summarized CCEJ (student → instructor), the CALCOM 300-machine
rollout, and the INEGI internship (PHP tooling, Oracle 8i/HP-UX), citing
`#origins` among its source chips alongside `#faq`, `#ibm`, `#tcs-banamex`,
`#oracle`, `#tcs-ge`. Grounded and era-appropriate.

## Screenshots

Saved to disk:
- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-lcDg0L/screenshot-1787098755876-11.jpg` — chat widget with the origins-grounded answer
- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-lcDg0L/screenshot-1787098763251-13.jpg` — Projects section mid-scroll (incidental, from a scroll-to-top attempt that stopped short)
- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-lcDg0L/screenshot-1787098785728-14.jpg` — full rail after the header-clearance fix, all 8 nodes visible with clean spacing

## Unrelated Dev-Mode Console Error (Not This Change)

A Next.js dev overlay showed "1 Issue" throughout this session: `eval() is
not supported in this environment... React requires eval() in development
mode for various debugging features.` This is a generic React/Turbopack
dev-mode internals warning (CSP/eval restriction in the browser automation
environment), unrelated to `OriginsSection`, `CareerTimeline`, or any file
this change touches. Confirmed present before touching any origins-specific
code path; not investigated further as out of scope.

## Outcome
- Step 12 status: PASS
- Blocking issues: none
- Code changes made this step: `components/CareerTimelineStyles.ts`
  (`timelineNavClass` header-clearance fix, design.md Decision 9)
- Known residual, documented and scoped as pre-existing future work: rail/
  header collision not fully eliminated below ~817px viewport height
