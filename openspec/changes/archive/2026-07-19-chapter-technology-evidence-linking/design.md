## Context

`CareerChapter.tsx`'s "Technologies" section (§F3 element 6) currently renders `experience.technologies` as a plain `<ul><li>` list of tech-name strings — no evidence, no link, exactly the "unlinked buzzword" PRD §4.4 warns against. The content model has no field connecting a specific technology to a specific project (`ExperienceProjectSchema` has `title`/`outcome`/`metrics` only), and `skills.yaml`'s skill names don't overlap with technology names. The user chose, when this gap was surfaced, to link each technology to its own chapter's "Projects" section (§F3 element 4) as a whole — real evidence that already exists, no new content authoring.

## Goals / Non-Goals

**Goals:**
- Every technology in a chapter's Technologies list is a real link, not static text.
- The link lands the visitor on that same chapter's Projects section.
- The link's purpose is clear to assistive technology, not just sighted/hover users.

**Non-Goals:**
- Per-project technology tagging (the rejected alternative — would require new real content from the user).
- JOS-59's skills.yaml evidence-linking (a different site section).
- Anything beyond the Technologies → Projects link.

## Decisions

**1. Anchor ID scheme: `${experience.id}-projects`, scoped per chapter.**
Once JOS-79/JOS-80 add more chapters, a single shared id like `"projects"` would collide and only the first one would ever be reachable. Scoping by the chapter's own `id` (already computed by `getExperiences()` from the filename slug) guarantees uniqueness without new data.

**2. Same-chapter anchor link works correctly with no special handling.**
The Technologies section (§F3 element 6) renders after the Projects section (§F3 element 4) in DOM order, both inside the same `<details>` body. A visitor can only see the Technologies list once they've expanded the chapter — meaning the Projects section they're linking to is, by definition, already open and visible at that point. No JavaScript scroll-handling or `<details>` auto-open logic is needed; this is a plain native `<a href="#...">` fragment link. (As a bonus, modern browsers natively auto-expand a *closed* `<details>` when a fragment link targets content inside it — not required here since the target is already open, but confirms this pattern degrades gracefully even in a hypothetical future layout change.)

**3. Accessible link text: visible technology name + a visually-hidden suffix.**
A bare technology name repeated as a link across many chapters/technologies is ambiguous out of context (e.g., a screen reader's "list all links" view would show many identical "Python" entries with no indication of what they do). Each link's accessible name becomes "`{tech}` — jump to Projects" via a `sr-only` (visually-hidden, not `aria-hidden`) span appended inside the anchor, so sighted users see just the technology name while assistive technology gets the full purpose.

## Risks / Trade-offs

- [The link's destination (a chapter's own Projects section, not the individual project that actually used that technology) is less precise than true per-project tagging] → Mitigation: this is the deliberate, honest trade-off the user chose over fabricating data the content model doesn't have; documented here and in the proposal, not hidden.
- [`sr-only` utility class must exist or be added — check Tailwind's built-in `sr-only` utility is available before assuming a custom class is needed] → Mitigation: verify during implementation (Tailwind ships `sr-only` as a built-in utility since v2; confirm it compiles correctly in this project's v4 setup rather than assume).

## Migration Plan

Not applicable — additive markup/CSS change, no data migration.

## Open Questions

None outstanding — the core ambiguity (what "evidence" means for a technology) was resolved with the user before this design was written.
