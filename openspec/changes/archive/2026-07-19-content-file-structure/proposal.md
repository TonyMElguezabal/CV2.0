## Why

The CareerDNA site and its RAG chatbot both need to draw from the same authoritative profile content — Jose's positioning, experience, projects, skills, and FAQ — without duplicating it across UI components and retrieval tooling. PRD v1.1 §6 designates a version-controlled `/content` directory as this single source of truth, but the repository currently has no content model at all: no directory structure, no defined field shape per content type, and no example instance proving the shape is usable. This is Story 1.1 (Linear JOS-50) of Epic 1 — Content Foundation, and it is the first content/application artifact in the repo.

## What Changes

- Establish the `/content` directory structure defined in PRD v1.1 §6: `profile.yaml`, `experience/<company>.yaml`, `projects/<project>.md` (frontmatter + narrative body), `skills.yaml`, `faq.md`.
- Define the typed field shape for each content type so downstream consumers (hero, career chapters, evidence layer, chatbot retrieval) can rely on a stable contract rather than convention alone.
- Add one realistic placeholder instance per content type, sufficient to prove the shape end-to-end — not real career content (that is a separate authoring story).
- Introduce the minimal tooling needed to type-check and test that shape, since the repository has no application scaffold yet. The specific tooling choice is a design decision, not assumed here.
- **Explicitly out of scope**: build-time validation logic (required-field enforcement, dangling skill→evidence reference checks) — that is Story 1.2 (JOS-51), which extends this capability's requirements. Real content authoring — that is Stories 1.3a/1.3b/1.3c (JOS-78/79/80).

## Capabilities

### New Capabilities
- `content-model`: version-controlled, typed structured content (profile, experience, projects, skills, FAQ) as the single authoritative source for both the rendered site and the chatbot's retrieval corpus, kept separate from UI components.

### Modified Capabilities
<!-- None: this is a greenfield capability, openspec/specs/ has no existing capabilities to modify. -->

## Impact

- **Affected code**: none exists yet. This change introduces the first application code in the repository — a minimal project scaffold (chosen in design.md) plus the `/content` directory and its typed shape.
- **Affected docs**: `docs/backend-standards.md` and `docs/frontend-standards.md` describe an unrelated stack (Express/Prisma/DDD backend, Create React App/Bootstrap frontend) left over from an earlier exploratory multi-tenant framework concept, conflicting with PRD v1.1 §8 (Next.js, Tailwind, no DDD layering). Per explicit user decision (2026-07-17), these two docs are treated as fully stale for all CareerDNA work — not followed by this change or future ones. A follow-up change should rewrite or remove them, mirroring the `docs/data-model.md` rewrite already completed for the analytics capability.
- **Downstream dependents**: this capability is a prerequisite for Story 1.2 (build-time validation, extends these requirements), Stories 1.3a/1.3b/1.3c (content authoring, populate the shape with real data), Story 2.2 (hero content, consumes `profile.yaml`), Story 3.3 (career chapters, consumes `experience/*.yaml`), Stories 4.1/4.2 (evidence layer, consumes `skills.yaml` and `projects/*.md`), and Story 5.2 (chatbot retrieval, consumes the full corpus).
