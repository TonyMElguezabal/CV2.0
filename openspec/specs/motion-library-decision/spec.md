## Purpose

Records the evidence-based selection of the site's motion library (Framer Motion, chosen over GSAP ScrollTrigger) and the scaffolding guarantees around introducing the real Next.js + Tailwind application into the repository.

## Requirements

### Requirement: Comparative hero prototype
The system SHALL include two working implementations of the same signature hero sequence — one using GSAP ScrollTrigger, one using Framer Motion — built against real content, so the motion library decision is evidence-based.

#### Scenario: Both candidate implementations render the same sequence
- **WHEN** each candidate implementation is run
- **THEN** it demonstrates a scroll-driven or on-load signature animated sequence over the site owner's real name and positioning statement

### Requirement: Recorded library decision
The system SHALL select exactly one motion library and document the rationale for that choice, informed by the comparative prototype.

#### Scenario: A decision is recorded
- **WHEN** the spike concludes
- **THEN** exactly one library (GSAP ScrollTrigger or Framer Motion) is selected, with rationale documented referencing the comparison

#### Scenario: The losing candidate is removed
- **WHEN** the decision is recorded
- **THEN** the non-selected library's dependency and implementation code are removed from the codebase, not left as dead code

### Requirement: Performance impact recorded against the PRD budget
The system SHALL measure the selected implementation against PRD §9's performance budget and record the result, including an honest statement if full measurement was not achievable in the execution environment.

#### Scenario: Performance is measured and recorded
- **WHEN** the selected implementation is measured
- **THEN** the spike report records Lighthouse performance/SEO/best-practices scores and LCP if a real audit was achievable, or First Load JS bundle size per route as a documented fallback if it was not

### Requirement: Application scaffold does not disturb existing tooling
The system SHALL merge the Next.js and Tailwind scaffold into the repository without breaking or overwriting existing content-model tooling, tests, or real project files.

#### Scenario: Existing test suite and validation remain green
- **WHEN** the scaffold merge is complete
- **THEN** `npm test` and `npm run validate:content` both pass exactly as before

#### Scenario: Generated framework files do not overwrite real project files
- **WHEN** the scaffold merge is complete
- **THEN** this repository's own `CLAUDE.md`, `AGENTS.md`, and `README.md` are unchanged by the merge
