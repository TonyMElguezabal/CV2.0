## Why

PRD §4.4 ("evidence over buzzwords") requires every claim to be verifiable, not just asserted. JOS-82's chapter rendering currently lists each chapter's technologies as plain, unlinked text — a buzzword list with nothing backing it up. This story closes that gap using data that already exists (a chapter's own projects), rather than fabricating a mapping the content model doesn't support.

Real gap resolved before this proposal: the original AC's phrasing ("per skills.yaml's evidence references") doesn't map onto the actual data — `technologies` (flat tech-name strings) and `skills.yaml` (skill names with chapter/project evidence) don't overlap, and no project records which specific technologies it used. Asked the user directly; the decision is that each technology links to its own chapter's "Projects" section as a whole, not a specific project or skill entry — real, honest evidence with no new content authoring required.

## What Changes

- Each chapter's "Technologies" list items become real anchor links (`<a href="#{chapterId}-projects">`) pointing to that same chapter's "Projects" section.
- Each chapter's "Projects" section gains a stable, chapter-scoped DOM `id` as the link target.
- No content-model, schema, or authored-content changes.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `career-chapter-rendering`: adds a requirement that chapter technologies link to evidence (the chapter's own Projects section), via a delta spec.

## Impact

- `components/CareerChapter.tsx`: Technologies list items become anchors; Projects section gains an `id`.
- `components/CareerChaptersStyles.ts`: new style constant(s) for the technology link.
- No new dependencies, no schema changes.
