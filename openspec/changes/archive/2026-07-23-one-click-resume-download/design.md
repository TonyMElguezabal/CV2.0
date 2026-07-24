## Context

Story 6.1 (JOS-68) was enriched on 2026-07-22 with the conclusion that AC1 (one-click static download) and AC3 (no dynamic generation) were already done, while AC2 (download tracked) was **blocked** on the then-unbuilt analytics epic (7.x). That enrichment is now stale: 7.1 (`cookieless-analytics-baseline`, JOS-70), 7.2 (`engagement-event-tracking`, JOS-71), and 7.3 (`analytics-event-store`, JOS-72) have all merged. As part of that work, `components/HeroCtas.tsx` was annotated with `data-analytics-event="resume_download"` and `components/AnalyticsTracker.tsx` gained a global, annotation-driven click handler that fires `track({ eventType: "resume_download", ... })` — with two dedicated tests in `AnalyticsTracker.test.tsx`. So **all three ACs are already satisfied and tested in the merged tree.** What is missing is (a) an accepted spec capturing this recruiter-facing behavior, and (b) a professional saved-filename. This change is deliberately documentation-first with a single one-line code polish.

## Goals / Non-Goals

**Goals:**
- Capture the shipped one-click-download + tracking + no-generation behavior as an accepted `one-click-resume-download` capability spec, so the spec library reflects reality (OpenSpec: docs are the source of truth).
- Apply the one remaining polish — a professional download filename — with its test updated.
- Re-verify all three ACs against the current tree as part of applying the change.

**Non-Goals:**
- Re-implementing anything already shipped (the link, the transport, the event schema, the click handler).
- Adding a second résumé CTA or a shared `trackDownload()` helper — the tracking is already global and annotation-driven, so any future CTA that carries `data-analytics-event="resume_download"` is tracked automatically with zero new code.
- Changing the résumé PDF's contents (an owner asset step).

## Decisions

### 1. Documentation-first change, not a rebuild
The correct response to "the feature already exists but has no spec" is to write the spec and verify the code, not to re-create the code. The `tasks.md` is therefore mostly verification, with one real edit. This is honest about what shipped and where (7.1/7.2), and gives JOS-68 a proper archived-change trail like every other story.

### 2. The one code change is a professional download filename
`components/HeroCtas.tsx`'s résumé link currently uses a bare `download` attribute, so the browser saves the file as `resume.pdf`. Setting `download="Jose Munoz Elguezabal.pdf"` gives recruiters a professionally-named file (full name, matching how Jose is identified elsewhere on the site). This is inert to rendering, the CSP, and the performance budget — it only affects the saved filename. `HeroCtas.test.tsx` already asserts the `download` attribute exists; the assertion is tightened to check the explicit value.

### 3. Tracking stays where it is — no new helper
The enrichment floated a shared `trackDownload()` helper "once a second CTA exists." It doesn't exist, and it isn't needed: `AnalyticsTracker`'s document-level click handler already fires `resume_download` for **any** element carrying `data-analytics-event="resume_download"`, so a future second CTA is tracked by annotation alone. Adding a helper now would be speculative and would duplicate a mechanism that already works globally. The spec's "any résumé CTA" requirement is satisfied by the single hero CTA today and by the annotation convention for any future one.

## Risks / Trade-offs

- **[Risk]** A spec that merely documents existing code can drift from it. → **Mitigation:** the apply step re-verifies each AC against the tree (asset present, annotation present, tracking tests green), so the spec is confirmed accurate at archive time.
- **[Trade-off]** Very small code footprint for a full OpenSpec change. Accepted — the value here is the accepted spec + verification trail, not lines of code; the alternative (closing the ticket with no spec) would leave a shipped feature undocumented in the spec library.
- **[Risk]** The résumé PDF could be an outdated draft. → **Mitigation:** flagged as an owner content check in tasks; out of scope for code but worth a one-line confirmation.

## Migration Plan

Add the explicit `download` filename in `HeroCtas.tsx` and tighten its test → `npx vitest run` (targeted + full) / `tsc` / `validate:content` clean → `next build` sanity (the hero remains static) → post-merge, sync the delta spec into `openspec/specs/one-click-resume-download/` and archive. Rollback is trivial (revert the one-line attribute); the spec is additive.

## Open Questions

- None blocking. Whether to add a second résumé CTA (e.g. in the contact section) is a separate product decision (6.2 / JOS-69 territory), not required by this story's ACs.
