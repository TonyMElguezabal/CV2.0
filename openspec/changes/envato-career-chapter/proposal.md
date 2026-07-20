## Why

JOS-79 requires two fully polished career chapters as the Phase 1 → Phase 2 quality gate (PRD §12). `content/experience/oracle.yaml` already satisfies all seven §F3 elements from the 1.3a template work, but it is the only chapter authored so far. A second real chapter — Envato/Placeit (Project Delivery Manager, Mar 2019–Nov 2021) — is needed before Phase 2 (RAG chatbot build) can start against real, evaluable content.

## What Changes

- Add `content/experience/envato.yaml` as a second complete chapter satisfying the `Experience` schema and all seven §F3 elements: business context, responsibilities, 2–4 projects with outcomes/metrics, one leadership highlight, technologies, lessons learned.
- Extend `content/skills.yaml` so any skill demonstrated at Envato links its evidence to the new chapter (no unlinked skill claims, per F4).
- Confirm `content/experience/oracle.yaml` remains valid and is treated as reviewed (existing content, no structural changes expected).

## Capabilities

### New Capabilities
(none — reuses the existing chapter authoring template and validation gate)

### Modified Capabilities
- `chapter-content-template`: adds a requirement that a second real chapter (Envato) satisfies the content model, and that the Phase 2 "two polished chapters" gate (PRD §12) is met once both `oracle.yaml` and `envato.yaml` are complete and pass validation.

## Impact

- `content/experience/envato.yaml` (new file)
- `content/skills.yaml` (updated evidence links)
- No component or schema code changes expected — `CareerChapters.tsx` and `lib/content/*` already handle N chapters generically
- `npm run validate:content` must pass against the updated `/content` tree
