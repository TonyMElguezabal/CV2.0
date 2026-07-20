## Context

`content/experience/oracle.yaml` (Story 1.3a) established the reusable chapter template and proved the `Experience` schema, rendering pipeline (`CareerChapters.tsx`), and technology-evidence linking (`skills.yaml`) all work end-to-end for one real chapter. JOS-79 requires a second real, fully polished chapter — Envato/Placeit (Project Delivery Manager, Mar 2019–Nov 2021) — to satisfy the PRD §12 "two polished chapters" gate before Phase 2 (RAG chatbot) work begins. The resume on file has only two thin bullets for this role; the actual chapter content (context, 2–4 projects with metrics, leadership story, technologies, lessons) must be gathered directly from the site owner.

## Goals / Non-Goals

**Goals:**
- Author `content/experience/envato.yaml` satisfying every field the `Experience` schema requires and all seven §F3 elements.
- Link every technology/skill claimed in the chapter to evidence in `content/skills.yaml` (F4: no unlinked skill claims).
- Pass `npm run validate:content` and the existing `CareerChapters` rendering/no-JS-readability behavior with zero code changes.

**Non-Goals:**
- No schema changes (`lib/content/schemas.ts` already supports N chapters generically).
- No component changes (`CareerChapters.tsx` already renders whatever `getExperiences()` returns).
- No new validation rules — reuses the content-validation gate established in prior changes.
- Does not re-review or restructure `oracle.yaml`; it is treated as already complete from 1.3a.

## Decisions

- **Reuse the existing template and schema as-is** rather than introducing an Envato-specific structure, since the goal is parity with `oracle.yaml`'s pattern (proven by 1.3a) and the schema is already generic across chapters.
- **Source raw content directly from the site owner via conversation**, not solely the resume, because the resume's Envato bullets are too thin (2 lines) to derive 2–4 projects with metrics, a leadership story, or a lessons-learned reflection without fabricating detail — CLAUDE.md's "question assumptions" principle rules out inventing specifics.
- **Skills evidence updates are additive**, appending `envato` to existing skill entries where applicable and adding new skill entries only if a skill is genuinely new to this role, to avoid diluting oracle's existing evidence trail.

## Risks / Trade-offs

- [Risk] Available raw detail from the site owner may not yield 2–4 projects with real metrics → Mitigation: ask targeted follow-up questions per §F3 element; if a metric genuinely doesn't exist, use a qualitative outcome rather than a fabricated number (matches oracle.yaml's mix of quantitative/qualitative metrics).
- [Risk] Chapter reads as duplicative of oracle.yaml in tone/structure → Mitigation: mirror oracle.yaml's field structure but keep voice/content specific to Placeit.net's actual product and team context.

## Open Questions

- None outstanding for design; specific content gaps will surface once the site owner provides raw Envato career details during `tasks.md` execution.
