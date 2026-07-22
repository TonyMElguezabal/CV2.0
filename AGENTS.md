---
description: This document contains all development rules and guidelines for this project, applicable to all AI agents (Claude, Cursor, Codex, Gemini, etc.).
alwaysApply: true
---

## 1. Core Principles

- **Small tasks, one at a time**: Always work in baby steps, one at a time. Never go forward more than one step.
- **Test-Driven Development**: Start with failing tests for any new functionality (TDD), according to the task details.
- **Type Safety**: All code must be fully typed.
- **Clear Naming**: Use clear, descriptive names for all variables and functions.
- **Incremental Changes**: Prefer incremental, focused changes over large, complex modifications.
- **Question Assumptions**: Always question assumptions and inferences.
- **Pattern Detection**: Detect and highlight repeated code patterns.

## 2. Language Standards
- **English Only**: All technical artifacts must always use English, including:
    - Code (variables, functions, classes, comments, error messages, log messages)
    - Documentation (README, guides, API docs)
    - Jira/Linear tickets (titles, descriptions, comments)
    - Data schemas and database names
    - Configuration files and scripts
    - Git commit messages
    - Test names and descriptions

## 3. Specific standards

**Single source of truth**: [Base Standards](./docs/base-standards.md) is the canonical foundation for all project standards. Load it first; when any other document conflicts with it, base standards win.

For detailed standards and guidelines specific to different areas of the project, refer to:

- [Base Standards](./docs/base-standards.md) - Canonical, single source of truth for all standards
- [Backend Standards](./docs/backend-standards.md) - API development, database patterns, testing, security and backend best practices
- [Frontend Standards](./docs/frontend-standards.md) - React components, UI/UX guidelines, and frontend architecture
- [Documentation Standards](./docs/documentation-standards.md) - Technical documentation structure, formatting, and maintenance guidelines, including AI standards like this document
- [OpenSpec Tasks Mandatory Steps](./docs/openspec-tasks-mandatory-steps.md) - Required checklist and execution rules when creating or updating OpenSpec `tasks.md` files

Reference specifications:

- [API Spec](./docs/api-spec.yml) - API contract
- [Data Model](./docs/data-model.md) - Data model

## 4. Project Skills

- Skills live in `ai-specs/skills`.
- When a request matches a skill, load and follow the corresponding `SKILL.md` automatically before continuing.
- Also load any referenced files in the skill folder (for example, `references/*.md`) when the skill requires them.

## 5. Planning Model Requirement

Planning workflows must run with Opus high reasoning.

This requirement applies to:
- `enrich-us`
- `openspec-ff-change`
- `openspec-continue-change`

Before starting any of these workflows, verify the session is using Opus high reasoning. If it is not, **self-correct** by adding `"model": "claude-opus-4-7"` to `.claude/settings.json` (use the `update-config` skill or edit directly), then continue — do not stop and ask the user. Do the same to come back to sonnet medium for any other step.

## 6. Symlink Integrity and Multi-Agent Portability

- **Canonical Source**: Keep reusable artifacts in `ai-specs` as the canonical source. Agent-specific paths (such as `.claude` and `.cursor`) should reference them through symlinks when possible.
- **Update Safety**: Whenever a file is renamed, moved, or its suffix changes, verify and update all symlinks that target it before considering the change complete.
- **New Artifact Linking**: Whenever creating a new artifact that requires multi-agent exposure (for example new agents or skills in `ai-specs`), create the corresponding symlinks from the expected agent-specific reference paths.
- **External Customization Review**: Whenever customization is introduced outside `ai-specs`, evaluate whether it should be moved into `ai-specs` and replaced with symlinks from the original locations.
- **Completion Gate**: A change is incomplete if it leaves broken symlinks, stale targets, or duplicated canonical artifacts across agent-specific folders.

## 7. Mandatory OpenSpec Artifact Updates for Post-Apply Changes

When a new fix/change request appears after `opsx:apply` (or `/apply`) and before `opsx:archive` (or `/archive`), agents must treat it as a spec update first, not as an informal "fix this quickly". It's the core principle of openspec, documentation is the source of truth.

Required order:

1. Update the current OpenSpec change artifacts that are affected (for example: scenarios, requirements/specs, and `tasks.md`). Don't add tasks as "bugfixes" but as part of the initial design, thus in the proper section
2. If artifact regeneration is needed, run the corresponding OpenSpec step (`opsx:continue`, `opsx:ff`, or equivalent) before coding.
3. Implement code only after artifacts reflect the new request.
4. Re-run verification against the updated artifacts before archiving.

Do not apply direct code-only fixes in this window without updating OpenSpec artifacts.

## 8. Development Commands

```bash
npm install
npm run dev              # Next.js dev server
npm run build             # production build
npm run start              # serve the production build
npm run lint                 # ESLint
npm test                      # Vitest suite (run once, no watch)
npx vitest                     # Vitest in watch mode
npx vitest run path/to/file.test.ts        # single file
npx vitest run -t "test name substring"       # single test by name
npx tsc --noEmit                                # strict-mode type check
npm run validate:content                         # content-schema gate (see below)
```

There is no `test:watch` or `test:coverage` script — use the `npx vitest` forms above.

## 9. Architecture

This is **CareerDNA**: Jose Muñoz's interactive professional profile, built as
a static-first Next.js (App Router) site. Full product spec: `docs/PRD.md`.
Repo layout notes: `README.md`.

**Content-first design.** `/content` (YAML + Markdown) is the single source
of truth for profile data — career chapters, projects, skills, FAQ — kept
strictly separate from `/components`. This same content is meant to back a
planned RAG chatbot (PRD §5/§7), so content shape and evidence-linking
integrity matter beyond rendering.

- `lib/content/schemas.ts` — Zod schemas defining the content contract.
- `lib/content/read.ts` — reads/parses `/content` at request/build time via
  `process.cwd()` (not `import.meta.dirname` — this module is bundled into
  Next.js, unlike `validate.ts`/`cli.ts` which only run via raw `node`).
- `lib/content/validate.ts` (+ `lib/content/cli.ts`) — build-time gate
  (`npm run validate:content`) that fails non-zero on missing fields,
  dangling skill→evidence references, or malformed dates. Run this after any
  `/content` edit.
- `components/` — presentational layer consuming the typed content (e.g.
  `CareerChapters.tsx` renders `getExperiences()` output as native
  `<details>`/`<summary>` chapters — chosen for free keyboard operability and
  no-JS readability over a custom button + ARIA state approach).

**Stack choices worth knowing before changing them:**
- Framer Motion was selected over GSAP ScrollTrigger via a comparative spike
  documented in `openspec/changes/archive/2026-07-19-motion-library-spike/`.
- `typescript` is pinned at `5.9.3` because Next.js 16.2.10's build tooling
  is not yet compatible with TypeScript 7 — don't bump it without re-checking.
- Tests use Vitest. Component tests opt into a `jsdom` environment per file
  via a `// @vitest-environment jsdom` pragma (Vitest 4's
  `environmentMatchGlobs` isn't available in the pinned version); content/lib
  tests stay on Vitest's default `node` environment.

**Not yet built (see PRD for design intent):** the RAG chatbot API route,
analytics event store, and admin insights dashboard. There is currently no
backend/database in this repo — everything ships as static content plus
React components.

**Stale docs — do not trust for this repo's actual stack:**
`docs/backend-standards.md`, `docs/frontend-standards.md`, and
`docs/development_guide.md` describe a different, unrelated project's stack
(Express/Prisma/PostgreSQL backend, Bootstrap/Cypress/React Router frontend).
They predate CareerDNA and have not been reconciled with it. Prefer
`docs/base-standards.md`, `docs/PRD.md`, `docs/data-model.md`, and this file
for anything specific to this repo; treat the other two `*-standards.md`
files as generic-practice reference only, not a description of this codebase.

## 10. OpenSpec

Spec-driven workflow lives in `openspec/` (`openspec/specs/` = current
accepted specs, `openspec/changes/` = in-flight or archived change
proposals). Use the `opsx:*` skills/commands for propose/explore/apply/sync/
archive rather than editing these by hand.

