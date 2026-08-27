## ADDED Requirements

### Requirement: The eval set covers the origins record
The eval set SHALL contain factual coverage for the origins record, so the formative material is proven reachable rather than merely indexed. Coverage SHALL satisfy the content-derived coverage gate, so origins entries cannot be published without a corresponding eval question.

#### Scenario: Origins coverage is present
- **WHEN** the eval set is inspected
- **THEN** it contains at least one factual question anchored to the origins record, whose expected substrings are grounded in that content

#### Scenario: The career-span question is answerable
- **WHEN** a graded eval run answers a question about how long Jose has worked in technology
- **THEN** the answer reaches the origins record's starting point rather than the earliest full career chapter

#### Scenario: An uncovered origins entry fails the gate
- **WHEN** an origins entry exists in content with no factual eval question covering it
- **THEN** the coverage check fails, identifying the uncovered entry

### Requirement: Era-disambiguation cases are proven against the expanded corpus
The era-disambiguation eval cases SHALL be executed against an index built with the origins content present, since that is the first corpus in which those cases are non-trivial. A present-day capability question SHALL NOT be answered from the origins record's legacy tooling.

#### Scenario: A cloud-capability question is unaffected by legacy content
- **WHEN** a graded eval run answers a question about current cloud or AI capability, against an index containing the origins record
- **THEN** the answer contains no forbidden legacy tooling marker, and the overall ship-readiness verdict accounts for that result

#### Scenario: Legacy tooling is answerable in its own right
- **WHEN** a visitor asks specifically about early-career technology
- **THEN** the answer draws on the origins record and identifies the period it belongs to, rather than presenting it as current capability
