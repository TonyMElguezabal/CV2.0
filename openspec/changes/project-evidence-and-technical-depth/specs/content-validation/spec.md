## ADDED Requirements

### Requirement: Unsubstantiated skill technology detection
The validator SHALL detect any technology named by a `skills.yaml` entry that does not appear in the `technologies` list of at least one chapter referenced by that entry's `evidence` array, and SHALL report the offending skill and technology.

This complements the existing dangling-reference check rather than replacing it: the dangling check proves an evidence reference *resolves*, while this check proves the referenced content *carries* the claimed technology. A skill can pass the first and fail the second.

The check is deliberately scoped to technologies, which are structured and comparable. It does not attempt to judge whether a chapter's prose substantiates a capability claim in a broader sense — that remains a human review step, so the gate never reports confidence it does not have.

#### Scenario: A skill claims a technology absent from all its evidence chapters
- **WHEN** validation runs and a `skills.yaml` entry names a technology that appears in no evidence chapter's `technologies` list
- **THEN** the result is invalid and includes an error naming that skill and the unsubstantiated technology, distinct from a dangling-reference error

#### Scenario: A skill claims a technology present in one of its evidence chapters
- **WHEN** validation runs and every technology named by a skill appears in at least one of its evidence chapters' `technologies` lists
- **THEN** no unsubstantiated-technology error is reported for that skill

#### Scenario: A skill names no technologies
- **WHEN** validation runs and a `skills.yaml` entry carries no technologies list
- **THEN** no unsubstantiated-technology error is reported for that skill, and its existing validation is unchanged

#### Scenario: A skill's evidence references a project rather than a chapter
- **WHEN** a skill names technologies and its evidence includes a project ID
- **THEN** that project's own declared skills and its chapter's technologies are both eligible to satisfy the check, so linking a project does not weaken the requirement
