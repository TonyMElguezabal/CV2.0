## ADDED Requirements

### Requirement: The index covers the origins record
The generated index SHALL contain a chunk for every origins entry, so the retrieval corpus reaches the formative period rather than beginning at the earliest full career chapter. Each origins chunk SHALL carry its entry's period within its text, so a chunk retrieved in isolation is attributable to an era.

#### Scenario: Origins entries are retrievable
- **WHEN** the content chunks are generated
- **THEN** each entry in the origins record contributes at least one chunk containing that entry's narrative

#### Scenario: Origins chunks name their period
- **WHEN** an origins chunk is generated
- **THEN** its text names the entry's period, so the era it describes is determinable from the chunk alone

#### Scenario: Origins chunks are distinguishable by source
- **WHEN** the generated chunks are inspected
- **THEN** origins chunks carry a source identifying them as origins content, distinct from career-chapter, project, skill, FAQ, profile and meta chunks

#### Scenario: Origins chunks deep-link to the origins section
- **WHEN** an answer cites an origins chunk
- **THEN** the citation's anchor resolves to the origins section on the page
