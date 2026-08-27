## ADDED Requirements

### Requirement: The site publishes a pre-résumé formative record
The site SHALL publish an origins record covering the formative period before its first full career chapter, so that the profile presents a continuous arc from its actual beginning rather than starting mid-career. The record SHALL be sourced from validated content, not authored in components.

#### Scenario: The origins record is present
- **WHEN** the landing page is rendered
- **THEN** an origins section is present, containing entries drawn from the site's content, covering the formative period that precedes the earliest career chapter

#### Scenario: Origins content is validated at build time
- **WHEN** the content validation gate runs
- **THEN** the origins content is validated against its schema, and the build fails on missing required fields rather than rendering an incomplete section

### Requirement: Origins entries carry approximate periods rather than calendar dates
Each origins entry SHALL carry a human-readable period label rather than a calendar-validated date range, because the genuine precision of this material is approximate. The system SHALL NOT require month-level precision for origins entries.

This exists so the content model represents the real uncertainty of decades-old recollection instead of laundering it into false precision that no one can verify.

#### Scenario: An entry describes an approximate period
- **WHEN** an origins entry is authored with an approximate period such as a year range or an age
- **THEN** it validates successfully, without requiring a month-precise start or end date

#### Scenario: Entry order is authored, not computed
- **WHEN** the origins entries are rendered
- **THEN** they appear in the order they are authored in the content, because their order is an editorial judgment about narrative sequence rather than a sort over dates

### Requirement: The origins record occupies exactly one timeline node
The origins record SHALL be reachable from the site's timeline as a **single** node covering the whole period, never as one node per entry, so that the timeline's fixed chrome remains navigable at its rendered viewport height.

#### Scenario: One node for the whole record
- **WHEN** the timeline is inspected
- **THEN** exactly one node corresponds to the origins record, regardless of how many entries that record contains

#### Scenario: Adding an entry does not add a node
- **WHEN** an entry is added to the origins content
- **THEN** the timeline's node count is unchanged

### Requirement: Origins entries are retrievable by the chatbot
Every origins entry SHALL contribute to the retrieval corpus, so that questions about the formative period are answered from content rather than refused as uncovered.

#### Scenario: Each entry is indexed
- **WHEN** the content chunks are generated
- **THEN** each origins entry contributes at least one chunk carrying its own narrative, identified as origins content

#### Scenario: Formative questions are answerable
- **WHEN** a visitor asks about the earliest part of the career — how long he has worked in technology, whether he has taught, or whether he has sold software
- **THEN** the answer is grounded in origins content rather than declining for lack of coverage

### Requirement: Legacy tooling appears as narrative and is never claimed as a current skill
Technologies named in origins entries SHALL appear only within that entry's narrative. They SHALL NOT be added to the site's skills surface, and origins entries SHALL NOT be usable as evidence for a claimed skill.

This exists because a decades-old tool listed as a present capability subtracts from the profile: it dilutes the current-technology signal and invites filtering on age, while the same fact stated as narrative — having worked across successive platform generations — is an asset.

#### Scenario: Origins technologies stay out of the skills surface
- **WHEN** the site's skills are inspected
- **THEN** none of them names a technology that appears only in origins content

#### Scenario: Origins entries are not skill evidence
- **WHEN** a skill's evidence references are resolved
- **THEN** each resolves to a career chapter or project, never to an origins entry

### Requirement: The record publishes a span and never a birth date or current age
The site SHALL express the length of the career as a span or a starting point, and SHALL NOT publish a birth date or state a current age. No content file SHALL contain a birth date.

#### Scenario: No birth date in content
- **WHEN** the content directory is inspected
- **THEN** no file contains a date of birth

#### Scenario: The arc is expressed as a span
- **WHEN** the origins record describes the length of the career
- **THEN** it does so as a starting point or a duration, rather than by stating a current age
