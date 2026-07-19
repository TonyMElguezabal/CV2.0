## Context

JOS-82's `CareerChapter.tsx` renders each chapter as a native `<details>`/`<summary>` element — a deliberate choice (see `openspec/changes/archive/2026-07-19-career-chapter-rendering/design.md` Decision 3) made specifically because native disclosure widgets toggle via browser-native behavior, requiring no JavaScript. Pre-proposal investigation via `curl http://localhost:3000/` confirmed the full seven-section chapter body is present in the raw SSR HTML response. Separately, `chapterSummaryClass` in `components/CareerChaptersStyles.ts` includes Tailwind's `list-none`, which removes the browser's default disclosure triangle, and nothing was added to replace it — so today there is no visible indicator that a collapsed chapter is expandable.

## Goals / Non-Goals

**Goals:**
- Prove, with real evidence, that chapter content and the expand/collapse control both function without JavaScript.
- Add a CSS-only visible expand/collapse indicator that rotates/changes state based on the native `[open]` attribute — no JavaScript involved.
- Correct the record: update this story's own artifacts (and, where relevant, note in this design doc) that the original "build a no-JS fallback" framing was based on a premise JOS-82 already invalidated.

**Non-Goals:**
- Redesigning the expand/collapse mechanism itself (stays native `<details>`/`<summary>`, per JOS-82).
- JOS-83's technology-to-evidence linking.
- Any hero (JOS-53/54/55) work.

## Decisions

**1. Verification method: SSR HTML inspection as primary evidence, live JS-disabled browser test attempted but not guaranteed.**
`curl`-based SSR HTML inspection is deterministic and repeatable: it proves content is present in the initial response regardless of any client-side behavior, which is the strongest form of evidence for "readable without JS." A live JS-disabled browser test will be attempted via `mcp__claude-in-chrome` (retrying `chrome://settings` navigation, which was blocked in JOS-54's browser verification); if still blocked, the SSR-HTML method stands as the documented, sufficient evidence — consistent with this repo's pattern of reporting the actual verification method used rather than silently claiming a fuller test than was performed.

**2. Visible indicator: Tailwind's `group`/`group-open:` variant + a `::-webkit-details-marker`-hiding arbitrary variant — pure CSS, zero JavaScript.**
`chapterDetailsClass` already includes Tailwind's `group` class. Adding `group-open:rotate-90` to a small chevron `<span aria-hidden="true">` inside `<summary>` ties its rotation directly to the native `<details open>` attribute via a compiled CSS attribute selector (`.group[open] .group-open\:rotate-90 { transform: rotate(90deg) }`) — no JavaScript is involved at any point; the browser's own state-change (toggling `open`) drives the CSS, the same way `:hover` or `:focus` would. `chapterSummaryClass` gains `[&::-webkit-details-marker]:hidden` alongside its existing `list-none`, since `list-none` alone only reliably hides Firefox's default marker — Chrome/Safari need the `::-webkit-details-marker` pseudo-element hidden explicitly for a consistent custom chevron across browsers.
*Alternative considered*: a JS-driven icon swap (e.g., a `useState` toggle changing an icon component). Rejected outright — it would reintroduce the exact JavaScript dependency this component was built to avoid, undermining the whole reason `<details>` was chosen in JOS-82.

**3. No other JS dependency found between the HTML root and the chapters section.**
Checked `app/layout.tsx` and `app/page.tsx`: neither wraps children in a client-only boundary, error boundary, or Suspense fallback that would hide content pre-hydration. `CareerChapters`/`CareerChapter` are Server Components (no `"use client"` directive) — they render directly to HTML with no client-side gating. The only client component on the page is `HeroFramer`, which is a sibling, not an ancestor, of the chapters section, so its "use client" boundary cannot affect the chapters section's SSR output.

## Risks / Trade-offs

- [Live JS-disabled browser verification may remain blocked by the extension's `chrome://settings` restriction] → Mitigation: SSR-HTML inspection is real, repeatable, sufficient evidence on its own; documented as the verification method actually used if the live test isn't achievable, per Decision 1.
- [`group-open:` is a Tailwind-version-dependent feature] → Mitigation: this repo already pins `tailwindcss@4.3.3`, which supports the `open`/`group-open` variant; verified by checking the compiled CSS output during implementation, not just assumed from Tailwind's documentation.

## Migration Plan

Not applicable — additive CSS-only change and verification work, no data migration.

## Open Questions

None outstanding.
