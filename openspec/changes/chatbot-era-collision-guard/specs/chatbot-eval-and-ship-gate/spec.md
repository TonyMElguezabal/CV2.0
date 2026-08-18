## ADDED Requirements

### Requirement: The eval set proves modern-capability questions are not answered from legacy tooling
The eval set SHALL contain questions about present-day technical capability whose grading forbids the appearance of unambiguously legacy tooling in the answer, so that expanding the corpus with early-career technology cannot cause a current-capability question to be answered from decades-old work.

Forbidden markers SHALL be limited to terms that are unambiguously historical. A term that legitimately describes both early and current work — a company name that is both a former database vendor and a present employer, for example — SHALL NOT be used as a forbidden marker, because doing so would fail correct answers.

#### Scenario: A cloud-capability question excludes legacy markers
- **WHEN** the eval set is inspected
- **THEN** it contains at least one question about current cloud or AI capability whose forbidden substrings include unambiguously legacy tooling markers

#### Scenario: A legacy-era answer fails the gate
- **WHEN** a graded eval run produces an answer to a current-capability question that contains a forbidden legacy marker
- **THEN** that result is graded as failing and the overall ship-readiness verdict is false

#### Scenario: Ambiguous terms are not forbidden
- **WHEN** the forbidden substrings of the era-disambiguation questions are inspected
- **THEN** none of them is a term that also describes current work, so a correct answer about present-day capability cannot be failed by the gate

### Requirement: Chapter and project coverage is derived from content, not a fixed list
The eval set's per-chapter and per-project coverage check SHALL determine which chapters and projects require coverage by reading the actual content, rather than comparing against a hardcoded list of identifiers. Adding a career chapter or project to `/content` SHALL therefore cause the coverage check to fail until an eval question covers it.

This exists because a hardcoded list degrades silently: a chapter added without updating the list is simply never checked, and the gap is invisible in a passing suite.

#### Scenario: A new chapter without eval coverage fails the check
- **WHEN** a career chapter exists in `/content` with no factual eval question anchored to it
- **THEN** the coverage check fails, identifying the uncovered chapter

#### Scenario: Coverage is evaluated against current content
- **WHEN** the coverage check runs
- **THEN** the set of chapters and projects it requires coverage for is read from the content itself, so it cannot fall out of step with what the site actually publishes

#### Scenario: The check still requires no live network calls
- **WHEN** the coverage check runs as part of the offline test suite
- **THEN** it reads content from disk and makes no embedding, generation, or other network request
