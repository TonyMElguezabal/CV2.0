## Context

The repository has no application code today — only documentation, OpenSpec scaffolding, and an unrelated bootstrap CLI (`packages/specboot`). This is the first change to introduce runnable code. PRD v1.1 §8 commits the eventual site to Next.js (App Router) + Tailwind, decided as a Phase 0 milestone, but that stack scaffold is not this story's concern — Story 1.1's acceptance criteria only require that structured content files exist, are separate from UI components, and hold a proven, typed shape (sized "moderate test surface via schema fixtures").

Per explicit user decision (2026-07-17), `docs/backend-standards.md` and `docs/frontend-standards.md` are stale leftovers from an unrelated earlier concept (Express/Prisma/DDD backend, Create React App/Bootstrap frontend) and are not followed here. The only standards in force are `docs/base-standards.md` (stack-agnostic: TDD, full typing, clear naming, incremental changes) and PRD v1.1 itself.

## Goals / Non-Goals

**Goals:**
- Establish the `/content` directory exactly as PRD v1.1 §6 defines it, with one realistic example instance per content type.
- Give that content a typed, tested contract so downstream stories (validation, hero, chapters, evidence layer, chatbot retrieval) can consume it with confidence.
- Introduce the minimum tooling necessary to type-check and test the content shape, without prematurely committing to the full Next.js app scaffold (a separate Phase 0 decision).
- Define the ID convention that cross-references depend on (skill → project/chapter references), since Story 1.2's validation and Story 4.1's evidence links both build on it.

**Non-Goals:**
- Build-time schema validation (required-field enforcement, dangling-reference detection) — Story 1.2 (JOS-51).
- Real career content — Stories 1.3a/1.3b/1.3c (JOS-78/79/80).
- The Next.js application shell, routing, or any UI component — a separate Phase 0 stack decision per PRD §11.
- Choosing the eventual embeddings/retrieval mechanism for the chatbot — Story 5.0 (SPK-2).

## Decisions

### 1. Minimal root-level TypeScript package now, not a full Next.js scaffold
Introduce a bare `package.json` + `tsconfig.json` (strict mode) at the repo root — nothing framework-specific. This gives the content types and tests somewhere to run without deciding the site framework prematurely. When the Phase 0 Next.js scaffold lands, it extends this `package.json` rather than replacing it (Next.js installs happily into a directory with an existing minimal `package.json`).
**Alternative considered**: scaffold Next.js now, since PRD names it. Rejected — that decision belongs to a dedicated Phase 0 story/spike, and coupling it to Story 1.1 would smuggle unrelated scope (routing, build config, Tailwind) into a content-shape ticket.

### 2. Vitest as the test runner
Use Vitest for the schema-fixture tests. It is ESM-native, has near-zero config, and is the conventional pairing for modern Next.js/TypeScript projects — unlike Jest+Babel, which is tied to the stale Create React App conventions in `docs/frontend-standards.md`.
**Alternative considered**: Jest (named in the now-stale frontend-standards.md). Rejected per the user's decision to treat that doc as stale; Vitest better fits a Next.js-bound, ESM-first codebase.

### 3. Content data lives in `/content`; typed contract and tests live in `/lib/content/`
```
/content                    # DATA ONLY — matches PRD §6 exactly
  profile.yaml
  experience/
    acme-corp.yaml          # one placeholder example
  projects/
    dashboard-revamp.md     # one placeholder example
  skills.yaml
  faq.md

/lib/content/                # CODE — not a UI component, reads the data
  types.ts                   # TypeScript interfaces per content type
  content.test.ts            # schema-fixture tests (Vitest)

package.json
tsconfig.json
vitest.config.ts
```
This keeps the PRD's "content separate from components" intent literal — `/content` holds nothing but data — while giving the typed contract a conventional home that a future Next.js app can absorb as `src/lib/content/` or leave at the root; either layout is supported by Next.js.
**Alternative considered**: put `types.ts` inside `/content/schema/`. Rejected — blurs the data/code boundary PRD §6 draws, even though the PRD's real concern is career content not being hardcoded into UI, not type definitions living nearby.

### 4. Parsing libraries: `yaml` for YAML, `gray-matter` for Markdown frontmatter
`yaml` (eemeli/yaml) is actively maintained, TypeScript-friendly, and dependency-free. `gray-matter` is the de facto standard for frontmatter + body parsing in content-driven Next.js sites, which this project will become.

### 5. ID convention: filename slug is the identifier
`experience/<company>.yaml`'s filename (without extension) is the chapter ID; `projects/<project>.md`'s filename (without extension) is the project ID. `skills.yaml` entries reference these slugs directly (e.g., `evidence: [acme-corp, dashboard-revamp]`). This is the contract Story 1.2's dangling-reference validation and Story 4.1's evidence links both depend on — recording it now avoids it being invented inconsistently later.
**Alternative considered**: explicit `id` field inside each YAML/frontmatter file, decoupled from filename. Rejected for this story — adds a field that must stay in sync with the filename for no benefit yet; can be introduced later if a real need emerges (e.g., renaming files without breaking references).

### 6. Test scope: shape assertions on the fixture, not full validation
Tests read each example file from disk, parse it, and assert the expected keys/shape are present (matching the TypeScript interfaces) plus that `skills.yaml`'s example entry resolves to a real experience/project slug. This proves the AC end-to-end without building the general-purpose validation engine (missing-field detection across arbitrary future files, malformed-date detection) that Story 1.2 owns.

## Risks / Trade-offs

- **[Risk]** The future Next.js scaffold (Phase 0 story) might not cleanly extend this minimal `package.json`, forcing rework. → **Mitigation**: keep the package.json minimal and free of assumptions (no bundler config, no framework deps) so a `next` install has nothing conflicting to work around.
- **[Risk]** Filename-as-ID (Decision 5) breaks references if a file is renamed. → **Mitigation**: Story 1.2's dangling-reference validation will catch this immediately at build time; acceptable for MVP scope.
- **[Risk]** One placeholder example per type may not surface shape edge cases that real content (1.3a/b/c) will hit. → **Mitigation**: Story 1.2 adds systematic validation before real content lands, and the example is deliberately realistic (not `foo`/`bar` stubs) to catch obvious gaps.

## Migration Plan

N/A — greenfield change, no existing system or data to migrate.

## Implementation Notes (post-hoc)

- Added `@types/node` as a devDependency alongside `typescript`/`vitest` — not explicitly listed in Decision 1/2, but required for strict-mode TypeScript to type Node's `fs`/`path` built-ins used by the tests to read fixture files from disk. No other divergence from the decisions above; all six were followed as written.

## Open Questions

- Exact placement of `/lib/content/` once the Next.js app scaffold exists (root-level `lib/` vs `src/lib/`) — deferred to the Phase 0 stack-decision story; this code has no framework dependency, so the move is expected to be trivial.
- Package manager (npm assumed as the lowest-friction default, no workspace tooling exists yet) — revisit if the project adopts a monorepo structure later.
