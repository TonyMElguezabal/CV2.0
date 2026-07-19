## Why

The site currently renders only the hero — no career content is visible below it. PRD §5 F3 requires each role to appear as a progressively-disclosed chapter (skim in 2 minutes, go deep in 20), and `content/experience/oracle.yaml` has held real, validated chapter data since Story 1.3a with nothing yet rendering it. This is the foundational rendering piece the rest of Epic 3 (timeline navigation, technology-evidence linking, no-JS readability) builds on.

## What Changes

- `lib/content/read.ts` gains `getExperiences()`, reading every `content/experience/*.yaml` file, parsing each through `ExperienceSchema`, and returning it with a computed chapter `id` (filename without extension, matching the convention already established in `validate.ts`).
- A new chapter list section renders below the hero, iterating over `getExperiences()` — built to scale from today's one real chapter to however many exist later, not hardcoded.
- Each chapter renders collapsed by default (role, company, mission, dates) and expands to the seven §F3 elements in order, using native `<details>`/`<summary>` for built-in keyboard and focus semantics.
- Technologies render as plain text in this story — evidence linking is JOS-83's separate scope. No-JS readability of the expand/collapse interaction is JOS-84's separate scope.

## Capabilities

### New Capabilities
- `career-chapter-rendering`: reading all experience chapters, and rendering each as a progressively-disclosed (collapsed/expanded) section with the seven §F3 elements in order, keyboard-operable with visible focus.

### Modified Capabilities
- None. `content-model` (existing main spec) already defines the `Experience` shape this story reads from — no requirement changes to that capability, only a new consumer of it.

## Impact

- `lib/content/read.ts`: new `getExperiences()` export.
- `app/page.tsx`: renders the new chapter list section below the hero.
- New component(s) under `components/` for chapter rendering (exact structure decided in design.md).
- No schema, database, or build-tooling changes.
