# Career Chapter Authoring Guide

This guide is for writing a new `content/experience/<company>.yaml` file — one
chapter per significant role, per PRD v1.1 §F3. It exists so each chapter can
be authored consistently without re-deriving the structure from scratch every
time.

**This file is documentation, not a scanned content file.** It lives outside
`content/experience/`, so `npm run validate:content` (Story 1.2) never treats
it as a real chapter. Copy the template below into a new
`content/experience/<company>.yaml` file and fill it in — don't create a
`.yaml` file from this guide's own directory.

## Why seven elements, in this order

PRD §F3 defines the chapter structure deliberately: readers get context before
detail (progressive disclosure), and every claim needs to trace back to a
project, outcome, or story (§4.4, "evidence over buzzwords" — no unlinked
skill claims, no invented metrics). Each element below maps directly to one
part of that structure:

1. **Company, role, dates, one-line mission** — who, where, when, and why the role existed in one sentence.
2. **Business context** — the problem the organization faced, in plain terms.
3. **Responsibilities** — framed as decisions and actions, not a duty list.
4. **Projects (2–4)** — each with a real outcome and at least one metric.
   If a real number isn't available, use a qualitative outcome rather than
   inventing a figure — never fabricate evidence.
5. **Leadership highlight** — one concrete story, not a generality.
6. **Technologies** — what was actually used, not a keyword list.
7. **Lessons learned** — one or two sentences, in your own voice.

## Template

Copy this into `content/experience/<company>.yaml` (the filename, without
extension, becomes the chapter's ID — used by `skills.yaml` evidence
references and by future chapter-rendering work):

```yaml
company: # e.g., "Oracle Corporation"
role: # e.g., "Senior Software Development Manager"
mission: # One sentence: why this role existed, in your own words
dates:
  start: # YYYY-MM, e.g., "2021-11"
  end: # YYYY-MM, optional — omit if this is the current role
context: >
  # The business problem the organization faced. A few sentences of plain,
  # concrete context — not a mission statement.
responsibilities:
  - # Each item is a decision or action, not a job-description duty.
  - # Aim for 3-6 non-overlapping items covering real breadth.
projects:
  - title: # A short, concrete project name
    outcome: # One sentence: what changed as a result
    metrics:
      - # A real, verifiable number or fact. If none exists yet, use a
      - # qualitative outcome instead — never invent a figure.
  # 2-4 projects total
leadership:
  - # One concrete story: a situation, what you did, and the result.
    # Prefer a single cohesive paragraph over a list of bullet points.
technologies:
  - # Real technologies actually used — not a generic skills list.
lessons: >
  # One or two sentences, in your own voice, on what this role taught you.
```

## Worked example

`content/experience/oracle.yaml` is the first real chapter written against
this template — use it as a concrete reference for tone, length, and how to
condense detailed notes into each field.
