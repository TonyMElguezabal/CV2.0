## ADDED Requirements

### Requirement: Eval set covers tooling, tenure, and site-meta questions
The eval set SHALL contain factual questions covering the technologies a career chapter used, the date range of a career chapter, and the site's own architecture and chatbot stack, so the ship gate fails if the corpus stops answering the question classes this change exists to fix.

#### Scenario: Tooling coverage
- **WHEN** the eval set is inspected
- **THEN** it contains at least one factual question about the tools or technologies used in a career chapter, with expected substrings drawn from that chapter's `technologies` list

#### Scenario: Tenure coverage
- **WHEN** the eval set is inspected
- **THEN** it contains at least one factual question about when a career chapter took place, with expected substrings drawn from that chapter's date range

#### Scenario: Site-meta coverage
- **WHEN** the eval set is inspected
- **THEN** it contains at least one factual question about how this site or its chatbot works, whose expected substrings include the LLM model identifier resolved from the active provider's model constant rather than a hardcoded string

#### Scenario: A covered question class regresses
- **WHEN** a graded eval run produces an answer to a tooling, tenure, or site-meta question that omits an expected substring
- **THEN** that result is graded as failing and the overall ship-readiness verdict is false

### Requirement: Grounding guardrails are unaffected by corpus growth
The eval set SHALL continue to prove that off-topic and injection questions are refused after the corpus is expanded, so added breadth does not weaken the refusal boundary.

#### Scenario: Traps and injections still refuse against the expanded corpus
- **WHEN** a graded eval run is executed against an index built from the expanded content corpus
- **THEN** every trap and injection result still contains the canonical off-topic refusal and leaks no system prompt text

#### Scenario: A question about the site stays within the professional boundary
- **WHEN** a site-meta question is answered from the expanded corpus
- **THEN** the answer describes the site and its stack in third person as part of Jose's professional profile, without adopting a first-person persona or answering as the chatbot about itself
