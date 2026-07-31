## MODIFIED Requirements

### Requirement: Missing required field detection
The validator SHALL detect any file under `/content` that is missing a field required by its content type's schema (`Profile`, `Experience`, `Project`, `Skill`, or `Meta`), and SHALL report the offending file and field. A `Skill` entry with an empty `evidence` array SHALL be treated as missing this required field. A `Skill` entry whose `summary` is absent, empty, or whitespace-only SHALL likewise be treated as missing a required field. A missing `content/meta.md` file SHALL be reported as a missing required content source.

#### Scenario: A content file is missing a required field
- **WHEN** validation runs against a content file lacking a field required by its type
- **THEN** the result is invalid and includes an error naming that file and the missing field

#### Scenario: A skill has an empty evidence array
- **WHEN** validation runs and a `skills.yaml` entry's `evidence` array is empty
- **THEN** the result is invalid and includes an error identifying that skill's evidence field, distinct from a dangling-reference error

#### Scenario: A skill has a missing or empty summary
- **WHEN** validation runs and a `skills.yaml` entry has no `summary`, or a `summary` that is empty or whitespace-only
- **THEN** the result is invalid and includes an error naming that skill and its `summary` field

#### Scenario: The meta content source is absent
- **WHEN** validation runs against a `/content` tree with no `meta.md` file
- **THEN** the result is invalid and includes an error identifying the missing meta content source

#### Scenario: The meta content source is malformed
- **WHEN** validation runs and `content/meta.md` is missing a frontmatter field required by the `Meta` schema
- **THEN** the result is invalid and includes an error naming that file and the missing field

## ADDED Requirements

### Requirement: Model identifier literals in meta content are rejected
The validator SHALL detect any hardcoded LLM or embedding model identifier written into `content/meta.md`, so self-describing content cannot silently drift out of sync with the model actually configured in code.

#### Scenario: Meta content hardcodes a model identifier
- **WHEN** validation runs and `content/meta.md` contains the active LLM model identifier or the embedding model identifier as a literal string
- **THEN** the result is invalid and includes an error naming the offending literal and directing the author to let the value be injected at index-build time

#### Scenario: Meta content contains no model literals
- **WHEN** validation runs and `content/meta.md` contains no model identifier literal
- **THEN** no model-literal error is reported
