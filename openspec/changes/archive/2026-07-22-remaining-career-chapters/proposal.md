## Why

JOS-80 (PRD §6 "Content is the critical path"; §11 Phase 3 deliverable) requires the remaining career chapters, project content, and FAQ so the full career-story corpus is ready before the Phase 2/3 chatbot build. Only 2 of the site owner's 7 real roles had chapters (Oracle, Envato — from 1.3a/1.3b); the other 5 roles existed only as thin resume bullets. Separately, `content/faq.md` still had fictional placeholder content ("Acme Corp") left over from before real chapter authoring began, which `chapter-content-template`'s existing "no fictional content" gate didn't catch since its check was scoped to specific chapter fixture filenames, not FAQ text.

The ticket's own acceptance criteria were internally inconsistent (2 done + "4 remaining" ≠ "7 total"). Per the site owner's direction, all 5 remaining resume roles get their own chapter, resolving the count at 7 total, matching the ticket's stated "7 chapters (confirmed total)" language.

## What Changes

- Author 5 new chapters — `tiempo.yaml`, `tcs-banamex.yaml`, `tcs-bcp.yaml`, `tcs-ge.yaml`, `ibm.yaml` — each satisfying all seven §F3 elements, built entirely from the site owner's own detailed input per role.
- Where the site owner explicitly flagged specific figures as unconfirmed estimates ("suggested metrics to validate," bracketed ranges) rather than confirmed facts, those figures are excluded — only definite, stated facts and numbers ship as metrics, matching the precedent already set for Oracle's chapter (flagged in JOS-81 for future real-number strengthening) rather than inventing or rounding placeholder ranges into shipped claims.
- Replace `faq.md`'s fictional "Acme Corp" Q&A with real content answering the PRD §1 five core questions ("Who is Jose?", "What problems has he solved?", "How does he lead teams?", "What technical depth does he possess?", "Why should someone hire him?") plus two supplementary questions, all grounded in facts already established across the real chapter corpus.
- Extend `skills.yaml`: existing skills' evidence extended to the new chapters where genuinely demonstrated, and three new skills added (Client Relationship & Contract Management, Service Recovery & Incident Management, Project Recovery & Turnaround) evidenced by achievements distinct from what oracle/envato already cover — every one of the 5 new chapters is referenced by at least one skill's evidence.

## Capabilities

### Modified Capabilities
- `chapter-content-template`: adds a requirement that the full seven-chapter corpus (not just the first one/two) satisfies the content model, and extends the "no fictional content" gate to explicitly cover `faq.md`, not only chapter fixture filenames.

## Impact

- New: `content/experience/tiempo.yaml`, `tcs-banamex.yaml`, `tcs-bcp.yaml`, `tcs-ge.yaml`, `ibm.yaml`
- `content/faq.md`: fictional content replaced with real Q&A
- `content/skills.yaml`: evidence extended, 3 new skills added
- No component or schema code changes — `CareerChapters`, `CareerTimeline`, and `SkillsSection` already handle N chapters/skills generically
- No new project cards — JOS-60 already scoped standalone project cards to 2 flagship projects only; this story doesn't add more
- `npm run validate:content` must pass against the full 7-chapter tree
