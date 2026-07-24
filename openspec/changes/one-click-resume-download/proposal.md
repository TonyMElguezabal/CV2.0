## Why

PRD §5 F6 promises a recruiter can download Jose's résumé in one click, with the download tracked as a conversion and no dynamic PDF generation (story 6.1, JOS-68). **All three of this story's acceptance criteria are already satisfied in the merged codebase** — the download link shipped with the hero, and the `resume_download` conversion tracking landed as part of the analytics epic (7.1/7.2, JOS-70/JOS-71). But the behavior is captured in **no accepted spec** — `openspec/specs/` has no résumé-download capability — so the spec library doesn't reflect a shipped, recruiter-facing feature. This change closes that documentation gap and applies the one small remaining polish: a professional saved-filename.

## What Changes

- **New accepted spec** `one-click-resume-download` capturing the already-true behavior: a single pre-approved statically-hosted PDF downloads in one click from any résumé CTA, each download fires a `resume_download` conversion event, and no dynamic PDF generation exists.
- **One code polish:** set an explicit `download` filename on the hero résumé link (`download="Jose Munoz Elguezabal.pdf"`) so the saved file has a professional name instead of `resume.pdf`. Update the `HeroCtas.test.tsx` assertion accordingly.
- **Verification (no build):** confirm `public/resume.pdf` is present and statically served, that `HeroCtas.tsx` carries the `data-analytics-event="resume_download"` annotation, and that `AnalyticsTracker.tsx` fires the event on click (already covered by two tests) — no dynamic-generation path exists anywhere.
- **Out of scope:** any change to the analytics transport or event schema (delivered by 7.1/7.3); adding a second résumé CTA (only the hero CTA exists today, and "any résumé CTA" is satisfied with one — a shared tracking helper is unnecessary because the tracking is already a global, annotation-driven click handler); replacing the résumé PDF content (an owner asset step, not code).

## Capabilities

### New Capabilities
- `one-click-resume-download`: a recruiter-facing one-click download of the single pre-approved, statically-hosted résumé PDF, with each download tracked as an anonymized `resume_download` conversion event and no dynamic PDF generation.

### Modified Capabilities
_None._ The `resume_download` event type, its client transport (`lib/analytics/track.ts`), and the annotation-driven click handler (`components/AnalyticsTracker.tsx`) are already defined by `cookieless-analytics-baseline` and `engagement-event-tracking`; this change documents the download surface that emits the event, and does not alter those capabilities' requirements.

## Impact

- **New files:** `openspec/specs/one-click-resume-download/spec.md` (on archive/sync).
- **Modified files:** `components/HeroCtas.tsx` (explicit `download` filename); `components/HeroCtas.test.tsx` (assert the filename value).
- **Unchanged (verified only):** `public/resume.pdf` (present, ~247 KB); `components/AnalyticsTracker.tsx` + `AnalyticsTracker.test.tsx` (already fire and assert `resume_download`).
- **No new dependencies, no new endpoint, no schema change, no new environment variables.** "OpenAPI documentation" is N/A — a static asset with client-side tracking that posts to the existing `POST /api/events` (7.3's endpoint), not a new route.
- **Public-site impact:** the résumé link stays a plain static-asset anchor; the filename attribute is inert to rendering/perf. No change to the static-first budget or CSP.
