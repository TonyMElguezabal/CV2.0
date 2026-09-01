Linear-Issue: JOS-118

## Why

Two gaps in the evidence layer, and one of them is about to get worse.

**Project deep-dives cover 2 of 7 chapters.** `/content/projects` holds
`adehub.md` and `ai-background-removal.md`. Across the seven career chapters
there are **20** `projects[]` entries with real narrative and metrics, but only
**2** carry a `projectId` linking to a standalone file. Projects are the site's
strongest format — Problem → Approach → Outcome → Metrics — and eighteen
instances of it are sitting unused inside collapsed chapters.

**The capability surface reads as historical.** `skills.yaml` has nine entries,
one of which (`AI/RAG Solution Delivery`) is modern-stack. Cloud is absent
entirely, even though the Oracle chapter lists OCI and OCI AI/LLM Services in
its `technologies`. This matters *now* because `origins-narrative` (JOS-115)
has just added twelve years of 1990s material. Historical depth without
matching current depth does not read as "thirty-two years of range" — it reads
as dated. **This change is the counterweight**, and the balance is the point,
not a side effect.

**The integrity risk is specific and the validator cannot see it.**
`validate.ts` checks that a skill's `evidence[]` ids *resolve* to real files.
It cannot check that the referenced chapter actually substantiates the claim.
Adding `Cloud Architecture → evidence: [oracle]` passes validation today, and
would be an unearned claim, because nothing in `oracle.yaml` documents
architectural ownership — OCI appears only as a technology tag against a role
whose stated mission is delivery and stakeholder alignment. The owner confirms
real architectural ownership exists; it is simply **not written down yet**. So
the ordering matters: the chapter documents the work, *then* the skill may cite
it — the same sequencing `executive-impact-surface` already applies to metrics
("author the detailed record first").

## What Changes

- **Standalone project files for the chapter projects that earn one**, selected
  against a stated criterion (a distinct Problem/Approach/Outcome arc plus
  metrics that survive the honesty bar) rather than a fixed list. Leading
  candidates: the TCS Banamex P1 turnaround, the TCS BCP distressed-program
  recovery, and the Oracle RAG chatbot — all three already carry metrics in
  their chapters and none has a file.
- **A technical-axis extraction session with the owner**, scoped to what
  `executive-impact-surface`'s commercial-axis session does *not* cover: which
  OCI services, which architectural decisions were owned versus reviewed versus
  delegated, and the real shape of the AI/LLM work.
- **Chapter prose is extended before any new skill is claimed.** The
  architectural and AI work gets documented in `experience/*.yaml` first.
- **New technical `skills.yaml` entries** — cloud and AI/LLM capability —
  added only after the backing chapters carry the claim.
- **A new substantiation gate.** `SkillSchema` gains an optional
  `technologies[]`, and the validator SHALL reject any technology a skill
  claims that does not appear in at least one of its evidence chapters'
  `technologies[]`. This is deliberately a *checkable* approximation of
  substantiation — see design.md Decision 2 for why the semantic version is
  left to a human task rather than pretended-automated.
- **A confidentiality decision record** for client naming: which names are
  cleared, which are not, and who decided.
- **A cap on the projects section**, so the strongest format does not degrade
  into a wall of cards as the set grows.
- **Deliberately does not** re-run `executive-impact-surface`'s commercial
  extraction, add any legacy tooling to `skills.yaml` (JOS-115 Decision 4
  forbids it, and this change is the counterweight that keeps the surface
  modern), or change how project cards render.

## Capabilities

### New Capabilities

- `technical-capability-evidence`: the rules governing how current technical
  capability is claimed — that a claimed technology must be substantiated by a
  backing chapter rather than merely referencing a valid one, that the
  capability surface stays weighted toward current work as historical content
  grows, and that naming a client is a recorded decision rather than an
  authoring convenience.

### Modified Capabilities

- `content-model`: `Skill` gains an optional `technologies[]` field, so a
  capability claim can name the technologies it rests on and be checked
  against its evidence.
- `content-validation`: the build-time gate gains unsubstantiated-technology
  detection, alongside the existing dangling-skill-evidence check it
  complements — the existing check proves a reference *exists*, the new one
  proves it *carries* the claimed technology.
- `project-cards`: the section gains an explicit cap and a stated ordering, so
  growing the project set strengthens the evidence rather than diluting it.

## Impact

- `content/experience/*.yaml` — chapter prose extended with the architectural
  and AI detail; `projects[]` entries gain `projectId` where a file is added.
- `content/projects/*.md` — new standalone project files.
- `content/skills.yaml` — new technical entries, each with `technologies[]`.
- `lib/content/schemas.ts` — `SkillSchema.technologies` (optional).
- `lib/content/validate.ts` (+ `cli.ts`) — the substantiation gate.
- `components/ProjectsSection.tsx` — cap and ordering.
- `lib/rag/eval-set.ts` — factual coverage for each new project, satisfying the
  existing per-project coverage requirement (no spec change needed; the
  requirement already reads "each of the site's career chapters and projects").
- Index rebuild required; `prebuild` handles it. Chunk count grows, so `k` and
  the era-disambiguation cases must be re-measured against JOS-116's guard.
- **No changes** to how chapters render, the retrieval pipeline's shape, or the
  Worker's bundled code.

## Depends on

`executive-impact-surface` (JOS-117) must land first. It runs the
commercial-axis extraction across the same accounts and touches the same three
files (`experience/*.yaml`, `projects/*.md`, `skills.yaml`) on a different
axis. Sequencing avoids a three-way content collision and lets this change read
JOS-117's extraction report rather than re-asking questions already answered.

`chatbot-era-collision-guard` (JOS-116) provides the corpus-growth gate this
change is measured against; it is already in place.
