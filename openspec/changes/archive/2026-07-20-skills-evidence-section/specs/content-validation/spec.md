## MODIFIED Requirements

### Requirement: Missing required field detection
The validator SHALL detect any file under `/content` that is missing a field required by its content type's schema (`Profile`, `Experience`, `Project`, or `Skill`), and SHALL report the offending file and field. A `Skill` entry with an empty `evidence` array SHALL be treated as missing this required field.

#### Scenario: A content file is missing a required field
- **WHEN** validation runs against a content file lacking a field required by its type
- **THEN** the result is invalid and includes an error naming that file and the missing field

#### Scenario: A skill has an empty evidence array
- **WHEN** validation runs and a `skills.yaml` entry's `evidence` array is empty
- **THEN** the result is invalid and includes an error identifying that skill's evidence field, distinct from a dangling-reference error
