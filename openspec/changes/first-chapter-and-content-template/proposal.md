## Why

Story 1.1 (`content-file-structure`) proved the content model's shape with fictional placeholder data (`acme-corp`, `dashboard-revamp`) — it never established a reusable pattern for authoring *real* chapters, nor decided how future chapters (1.3b, 1.3c) reuse that pattern without structural rework. Meanwhile those placeholders now sit in the real `/content` directory that the eventual site will render from, which is wrong for a real professional profile the moment real content exists. This change writes the first real chapter (Oracle Corp, Nov 2021–Jan 2026), retires the fictional fixtures, and defines the template mechanism 1.3b/1.3c will reuse.

## What Changes

- Add `content/experience/oracle.yaml` — the first real career chapter, covering all seven §F3 elements (role, business context, responsibilities, 2–4 projects with outcomes/metrics, one leadership story, technologies, lessons learned).
- **BREAKING** (for Story 1.1/1.2's own test suite, not for any shipped consumer — nothing yet renders this content): delete `content/experience/acme-corp.yaml` and `content/projects/dashboard-revamp.md` (fictional placeholders); update `content/skills.yaml` to reference only the real `oracle` slug.
- Refactor `lib/content/content.test.ts` (Story 1.1) to validate the content shape against isolated temporary fixtures instead of the literal real `/content` directory, so the test suite no longer depends on specific placeholder data existing — mirroring the pattern `build-time-content-validation`'s `validate.test.ts` already established.
- Define and document a reusable chapter-authoring template — a decision this story owns explicitly (resolved in design.md), so 1.3b/1.3c can each produce a new `experience/<company>.yaml` without re-deriving the structure.
- **Explicitly out of scope**: standalone `content/projects/*.md` narrative files for any of the four Oracle projects (a distinct content type owned by the Evidence Layer epic, Stories 4.1/4.2); adding real numeric metrics to the Oracle chapter's projects (tracked separately as a follow-up, blocked on the site owner); authoring 1.3b's or 1.3c's chapters.

## Capabilities

### New Capabilities
- `chapter-content-template`: a reusable authoring pattern and worked example that lets subsequent career chapters be produced against the content model (Story 1.1) without structural rework, and the retirement of placeholder content once real chapters exist.

### Modified Capabilities
<!-- None: `content-model` (Story 1.1) and `content-validation` (Story 1.2) have not been archived into openspec/specs/ yet — no baseline exists to diff against, consistent with both prior changes in this project. -->

## Impact

- **Affected code**: adds `content/experience/oracle.yaml`; deletes `content/experience/acme-corp.yaml` and `content/projects/dashboard-revamp.md`; updates `content/skills.yaml`; refactors `lib/content/content.test.ts` (owned by the already-merged Story 1.1) to use temp fixtures. Resolved in design.md: where the template artifact itself lives.
- **Affected docs**: likely an update to `README.md`'s content-model section or a new authoring guide, depending on the template-location decision in design.md.
- **Downstream dependents**: unblocks Story 3.3 (career chapters with progressive disclosure), which needs real content to render against; establishes the pattern Stories 1.3b and 1.3c will follow.
- **Verification**: `lib/content/validate.ts`'s existing "real content tree" check (no code change needed) must continue to pass once the real `oracle.yaml` replaces the fictional `acme-corp.yaml`.
