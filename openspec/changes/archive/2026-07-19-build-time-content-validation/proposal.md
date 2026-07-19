## Why

The content model established by Story 1.1 (`content-file-structure`) only proves its own hand-picked example files are well-formed — it provides no general-purpose gate that catches a missing field, a dangling skill→evidence reference, or a malformed date once real content authoring begins (Stories 1.3a/1.3b/1.3c). Without that gate, broken or unevidenced content can ship silently, directly undermining PRD v1.1 §4.4 ("if there's no evidence, the claim doesn't ship") and the §6 mandate that a build-time schema check fail on exactly these three failure classes.

## What Changes

- Add a standalone, testable validation engine that scans every file under `/content` and checks it against the shapes defined in `lib/content/types.ts` (from Story 1.1).
- Detect and report, with the offending file and field named: missing required fields, dangling `skills.yaml` evidence references (an ID that doesn't match any real `experience/*.yaml` or `projects/*.md` filename slug), and malformed dates.
- Exit non-zero on any failure, so the validation can gate a build once one exists; pass silently (zero exit) when all content is valid.
- **Explicitly out of scope**: authoring more content (Stories 1.3a/1.3b/1.3c), wiring this into an actual Next.js build pipeline (no such pipeline exists yet — a separate Phase 0 stack decision), and changing the shapes defined in `types.ts` (this story validates against that existing contract, it does not redesign it).

## Capabilities

### New Capabilities
- `content-validation`: a build-time validation engine that enforces the content model's shape and reference-integrity rules, independent of and consumed by any future build pipeline.

### Modified Capabilities
<!-- None: `content-model` (Story 1.1) has not been archived into openspec/specs/ yet, so there is no baseline to diff against. This change validates content-model's existing contract without altering its requirements. -->

## Impact

- **Affected code**: adds a validation module and its tests under `/lib/content` (or a sibling location — resolved in design.md), alongside the existing `types.ts`/`content.test.ts` from Story 1.1. No existing files from that story are modified.
- **Affected docs**: none required by this story; PRD v1.1 §6's "build-time schema check" line is what this story implements, not what it changes.
- **Downstream dependents**: this capability is a prerequisite for Story 4.1 (evidence layer, whose own acceptance criteria explicitly reference this validation enforcing "no unevidenced skill"), and indirectly protects every story that consumes real content once authoring begins.
- **Open question carried into design.md**: where this validation plugs into a real build process is not decided here — no Next.js app/build pipeline exists yet. This story's deliverable is a standalone script/function invocable via an npm script, ready to be wired into whatever build step a later story introduces.
