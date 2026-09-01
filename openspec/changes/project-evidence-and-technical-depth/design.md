## Context

The site's evidence layer has three tiers: chapters (`experience/*.yaml`),
standalone project files (`projects/*.md`), and the capability surface
(`skills.yaml`). The first tier is well populated. The second covers 2 of 7
chapters. The third is nine entries, one of them modern-stack.

Three existing constraints shape everything below:

- **`validate.ts` proves references resolve, not that they carry meaning.** The
  dangling-skill-evidence check confirms an id matches a file. It cannot
  confirm the file substantiates the claim. `executive-impact-surface`'s
  design.md already names this hazard ("a dangling-check-passing but
  substantively empty skill"); this change is where it stops being theoretical,
  because it adds skills whose backing prose does not exist yet.
- **`origins-narrative` (JOS-115) just added twelve years of 1990s content**,
  with a standing rule that legacy tooling never enters `skills.yaml`. That
  rule is the negative half of a balance. This change is the positive half.
- **`executive-impact-surface` (JOS-117) is proposed but unstarted** (0/83
  tasks) and already owns an extraction session, metric authoring into
  `projects[].metrics` and `projects/*.md` frontmatter, and a `skills.yaml`
  rebalance — the same three files this change needs.

## Goals / Non-Goals

**Goals:**

- Project-level evidence for the chapters that can genuinely support it.
- Current cloud and AI capability represented as honestly as the delivery
  capability already is.
- A validator gate that makes an unearned technology claim fail the build
  rather than pass silently.
- Client naming that is a recorded decision with an owner, not an authoring
  accident.

**Non-Goals:**

- Re-running JOS-117's commercial-axis extraction (headcount, budget, decision
  rights, CSAT). Different questions, same accounts — read its report instead.
- A standalone file for all 18 unlinked chapter projects. Volume is not the
  goal; the format's strength is its selectivity.
- Any legacy tooling in `skills.yaml`. JOS-115 Decision 4 forbids it and this
  change exists partly to enforce the counterweight.
- Semantic verification that prose "really" backs a claim — see Decision 2.
- Changing how chapters or project cards render, beyond the cap in Decision 5.

## Decisions

### Decision 1: Sequence after JOS-117; scope this extraction to the technical axis

JOS-117 and this change interrogate the same seven accounts and write to the
same three files. Running them concurrently produces a three-way merge over
hand-authored YAML prose — the worst possible conflict surface, because the
conflicts are semantic, not textual.

Sequencing rather than merging keeps each change reviewable: JOS-117 is already
83 tasks, and folding technical depth into it would produce a change no
reviewer can hold in their head. The owner selected sequencing over folding.

This change's extraction is therefore **scoped to what JOS-117's does not ask**:

| JOS-117 asks (commercial) | This change asks (technical) |
| --- | --- |
| Headcount, budget, decision rights | Which OCI services, and for what |
| CSAT/NPS and whether it moved | Which architectural decisions were *owned* vs. *reviewed* vs. *delegated* |
| Whether an account grew or renewed | The real shape of the RAG/AI work beyond "managed the integration" |
| What he built that nobody asked for | Which chapter projects have a distinct enough arc to earn a file |

Task Group 1 reads JOS-117's extraction report first, and any question already
answered there is not re-asked.

Alternative considered — *fold into JOS-117*. Rejected on reviewability, per
above. Alternative considered — *run independently and merge later*. Rejected:
the collision is in prose, and prose merges are where content integrity quietly
dies.

### Decision 2: The substantiation gate checks technologies, not semantics

The failure this change must prevent is `Cloud Architecture → evidence:
[oracle]` passing the build while `oracle.yaml` says nothing about
architecture. A validator cannot read prose and judge whether it supports a
claim. Pretending otherwise would produce a gate that reports confidence it
does not have.

So the gate is deliberately narrower and fully checkable:

- `SkillSchema` gains an optional `technologies: string[]`.
- The validator SHALL reject any technology named by a skill that does not
  appear in the `technologies[]` of at least one of that skill's evidence
  chapters.

This catches the specific, real failure mode — claiming a capability whose
technology the backing chapters never mention — with no false confidence about
the parts it cannot see. A skill with no `technologies[]` is unaffected, so the
existing nine entries need no migration.

What the gate explicitly does **not** do is confirm the prose describes
*ownership* rather than mere exposure. That judgment stays a named manual task
(Task Group 6), stated as a judgment, because a check that cannot fail on the
thing it claims to guard is worse than no check.

Alternative considered — *require a minimum prose length in the backing
chapter*. Rejected: length is not substantiation, and it would be trivially
satisfied by padding.

### Decision 3: Chapter prose is authored before the skill that cites it

The owner confirms genuine architectural ownership at Oracle exists. It is not
currently written down anywhere in `/content`. Adding the skill first and the
evidence later would mean the site makes a claim it cannot yet support, for
however long the gap lasts.

So the order is fixed: **extract → author chapter prose → then add the skill**.
This is the same ordering `executive-impact-surface` adopted for metrics ("the
drift gate means a headline can only state something a chapter or project
already states — so the detail must be authored before the summary"), applied
to capability claims. Decision 2's gate enforces the mechanical half of this;
Task Group 6 enforces the judgment half.

**Task Group 3 must be permitted to conclude "no".** If the extraction finds
the OCI work was integration and delivery rather than architecture, the honest
outcome is a skill named for what it was — cloud platform delivery, AI
integration — not `Cloud Architecture`. The task list states this explicitly so
that concluding "no" reads as the process working, not as a failure to
complete the task.

### Decision 4: A project earns a file by criterion, not by list

The ticket names TCS Banamex and TCS BCP as candidates. Both are strong. But
committing to a fixed list before the extraction pre-empts the thing the
extraction is for.

A chapter project earns a standalone file when **both** hold:

1. It has a distinct Problem → Approach → Outcome arc that is genuinely
   *different* from its chapter's `context`, rather than a restatement of it.
2. Its metrics survive the honesty bar — real, attributable, and hedged where
   they rest on recollection (the house style: "approximately", "roughly").

Leading candidates on current evidence: the TCS Banamex P1 turnaround
(~97% resolution-time reduction, already in the chapter), the TCS BCP
distressed-program recovery (unbaselined scope → all milestones closed), and
the Oracle RAG chatbot (already carries two metrics and is cited by an existing
skill, yet has no file). The extraction confirms or replaces these.

### Decision 5: The projects section is capped and ordered

Eighteen unlinked chapter projects exist. Rendering even half as cards would
turn the site's most selective format into a scroll. The section therefore
gains an explicit cap and a stated ordering (most recent first), so that adding
a project is a decision about what to *displace*, not just what to append.

This keeps the format's implicit promise: a card means "this one was
significant enough to write up", which is only true while the set stays small.

### Decision 6: Currency balance is an editorial invariant with a review question, not a metric

The ticket's real concern — that JOS-115's historical content plus no modern
counterweight makes the profile read as dated — is correct and worth
specifying. But it does not reduce to a ratio a validator can enforce, and
inventing one (e.g. "≥40% of skills must cite a post-2019 chapter") would be a
number with no grounding pretending to be a guarantee.

It is specified instead as a stated invariant with a concrete review question,
checked at review time: *does the capability surface, read cold, describe
someone working now?* The one machine-checkable half already exists — JOS-115's
rule that origins-only technologies never enter `skills.yaml` — and is
preserved unchanged.

### Decision 7: Client naming is a recorded decision

Existing content already names Citibanamex, Banco de Crédito del Perú, GE,
Oracle, and Envato/Placeit. New names are not an authoring judgment call: each
is cleared or refused by the owner explicitly, and the decision is recorded in
the change's extraction report — including the refusals, so a later author does
not re-litigate a name that was already declined.

## Risks / Trade-offs

- **JOS-117 is unstarted (0/83), so this change is blocked for an unknown
  period.** → Accepted deliberately; the alternative is the prose-merge
  collision in Decision 1. If JOS-117 stalls, the honest response is to
  re-scope this change to projects-only (which touches `projects/*.md` far more
  than the shared files), not to run it concurrently.
- **The extraction may not support a cloud *architecture* claim.** → Decision 3
  makes concluding "no" an explicit, allowed outcome with a named alternative
  framing, rather than a dead end that pressures the author toward the
  flattering reading.
- **Decision 2's gate can pass a skill whose prose is thin.** → Stated openly
  rather than papered over: the technology check is necessary, not sufficient,
  and Task Group 6 carries the judgment. The risk of a *narrow* honest check is
  much lower than a broad check that implies coverage it lacks.
- **Corpus growth may degrade retrieval.** → More projects means more chunks
  against JOS-116's era-collision guard, whose `k` was already raised 5 → 7
  during JOS-115. Task Group 9 re-runs the eval and re-measures rather than
  assuming the previous tuning still holds. Note the `.open-next/assets`
  staleness gotcha (CLAUDE.md): `npx opennextjs-cloudflare build` must run
  before `npm run eval:chat`, or the eval silently scores a stale index.
- **The cap will exclude a project someone wants included.** → That is the cap
  working. Decision 5 makes the trade-off explicit so the argument happens at
  review over *which* projects, not over whether to have a limit.

## Migration Plan

Content and one optional schema field. No data migration: `SkillSchema.technologies`
is optional, so the nine existing entries validate unchanged. Rollback is
reverting the commit — nothing is persisted outside the repo. The index is
rebuilt by `prebuild` on the next build either way.

## Open Questions

- **Which chapter projects earn files** — resolved by the extraction against
  Decision 4's criterion, not pre-committed here.
- **Which additional clients can be named** — owner decision per name,
  recorded per Decision 7.
- **The cap value in Decision 5** — set from the count the extraction actually
  yields; the requirement is that a cap exists and is stated, not a specific
  number chosen in advance.
- **Whether `Cloud Architecture` is the right skill name** — depends on
  Decision 3's outcome.
