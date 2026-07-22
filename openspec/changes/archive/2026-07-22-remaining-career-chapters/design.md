## Context

`chapter-content-template` and `career-chapter-rendering` already prove the content model and rendering pipeline scale to any number of chapters (established across 1.3a/1.3b and JOS-56/57/59/60). This story is almost entirely a content-authoring exercise, not a code change — the only rendering-adjacent question is Whether new chapters need special handling, and they don't (verified: full test suite and `validate:content` pass with zero component changes).

## Goals / Non-Goals

**Goals:**
- All 7 real chapters exist, matching the site owner's confirmed resolution of the ticket's internal 7-vs-6 count inconsistency.
- Every metric shipped is a fact the site owner presented as confirmed — never a rounded or invented version of a range they explicitly flagged as needing validation.
- `faq.md` is fully real, closing a gap `chapter-content-template`'s existing fictional-content gate didn't catch.
- Every new chapter is referenced by at least one skill's evidence, keeping the evidence layer coherent across the full corpus.

**Non-Goals:**
- No new standalone project cards — JOS-60 deliberately scoped that to 2 flagship projects; this story doesn't expand it.
- No code or component changes.
- Not resolving JOS-81 (Oracle metric strengthening) — a separate, already-tracked story.

## Decisions

- **Confirmed-vs-bracketed content filtering.** For each of the 5 roles, the site owner's raw input mixed definite, stated facts with explicitly bracketed "suggested metrics to validate" (e.g., `[20–40 processes]`, `[85–95% predictability]`). Every chapter was built using only the unbracketed, definite material — bracketed ranges were excluded entirely rather than rounded, averaged, or otherwise turned into a shipped number. This is the same "evidence over buzzwords" standard already applied to Oracle's chapter (§4.4), now applied consistently across all 5 new ones.
- **Chapter count resolved as 7 total (2 existing + 5 new), per the site owner's explicit direction**, superseding the ticket's own inconsistent "4 remaining" phrasing — all 5 remaining resume roles get chapters, none folded together or dropped.
- **Thin source material handled by finding real seams, not by padding.** IBM's role had only one continuous support engagement described — rather than inventing unrelated projects to hit the 2–4 project minimum, it was split into two real, distinct phases the site owner's own narrative already supported (individual-contributor analyst work → the informal team-lead transition), each with its own real outcome and metric.
- **`faq.md` answers the PRD §1 five core questions directly**, since those are explicitly what "every feature must serve" and what the future chatbot eval set (JOS-67) will need answered well — plus two supplementary questions, all citing only facts already shipped in the real chapter corpus.
- **`skills.yaml` evidence extended deliberately, not automatically.** Existing skills (Technical Program Leadership, Stakeholder Management, People Leadership & Conflict Resolution) were extended only to chapters that genuinely demonstrate them — not every new chapter added to every existing skill. Three new skills were added where a chapter's achievement was a genuinely distinct claim type not already covered (contract negotiation, incident/service recovery, program turnaround), rather than stretching an existing skill's meaning to cover it.

## Risks / Trade-offs

- [Risk] A YAML plain scalar list item containing an unquoted colon followed by a space (e.g., "Rebuilt project governance: RAID log...") is silently parsed as a nested mapping, not a string — `npm run validate:content` caught this immediately with a clear Zod error (`expected string, received object`) during authoring, and all 5 new files were subsequently checked for the same pattern → Mitigation: fixed at authoring time; the build-time schema gate makes this class of error impossible to ship unnoticed.
- [Risk] Excluding all bracketed figures leaves some chapters (e.g., TCS-BCP, IBM) with fewer quantified metrics than Oracle/Envato → Mitigation: consistent with this project's own precedent (JOS-81 exists specifically to add real numbers to Oracle later) — qualitative-but-real metrics are preferred over invented ones; a similar follow-up ticket could be created later if the site owner locates real figures for these roles too.

## Open Questions

None outstanding — chapter count and scope were confirmed directly with the site owner before content was drafted.
