## Why

PRD §9 requires the career story to remain readable if JavaScript fails. JOS-58's original AC assumed the chapter's expand/collapse control was JS-dependent and could leave content "stuck permanently collapsed" without JS. JOS-82 (already merged) chose native `<details>`/`<summary>` specifically because it needs no JavaScript to toggle — a deliberate choice that substantially de-risked this exact concern before this story started. Pre-proposal investigation (raw SSR HTML via curl) already shows all seven §F3 sections present in the initial page load, not gated behind client-only rendering. This story's job is to rigorously verify that claim rather than assume it, and to close a real, separate gap found during that investigation: the collapsed chapter has no visible indicator that it's expandable at all.

## What Changes

- Verify, with real evidence (SSR HTML inspection, and live JS-disabled browser testing if achievable), that chapter content and the expand/collapse control both work without JavaScript.
- Add a visible, CSS-only expand/collapse indicator to `CareerChapter.tsx`'s summary — currently `list-none` strips the native disclosure marker and nothing replaced it, so the only affordance today is a mouse-hover cursor change, invisible to keyboard users and JS-disabled visitors alike. The fix must not depend on JavaScript.
- Update JOS-58/JOS-82's original assumed AC framing to reflect what's actually true of the shipped implementation, rather than leave a stale "not yet built" premise in the record.

## Capabilities

### New Capabilities
- None. This story verifies and hardens behavior already covered by the `career-chapter-rendering` capability.

### Modified Capabilities
- `career-chapter-rendering`: adds an explicit no-JS-readability requirement (previously implicit/unverified) and a visible-affordance requirement for the expand/collapse control.

## Impact

- `components/CareerChapter.tsx`: adds a CSS-only chevron/marker element.
- `components/CareerChaptersStyles.ts`: new style constants for the indicator.
- No new dependencies, no schema or build-tooling changes.
