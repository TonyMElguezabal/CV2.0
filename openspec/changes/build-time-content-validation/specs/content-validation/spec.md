## ADDED Requirements

### Requirement: Missing required field detection
The validator SHALL detect any file under `/content` that is missing a field required by its content type's schema (`Profile`, `Experience`, `Project`, or `Skill`), and SHALL report the offending file and field.

#### Scenario: A content file is missing a required field
- **WHEN** validation runs against a content file lacking a field required by its type
- **THEN** the result is invalid and includes an error naming that file and the missing field

### Requirement: Dangling skill evidence reference detection
The validator SHALL detect any `skills.yaml` entry whose `evidence` array contains an ID that does not match any existing `experience/*.yaml` or `projects/*.md` filename slug, computed fresh from the files present at validation time.

#### Scenario: A skill references a non-existent chapter or project
- **WHEN** validation runs and a `skills.yaml` entry's evidence array contains an ID with no matching experience or project filename slug
- **THEN** the result is invalid and includes an error identifying the dangling reference

#### Scenario: A skill references an existing chapter and project
- **WHEN** validation runs and every `skills.yaml` evidence ID matches an existing experience or project filename slug
- **THEN** no dangling-reference error is reported for that skill

### Requirement: Malformed date detection
The validator SHALL detect any date field (`Experience.dates.start` or `Experience.dates.end`) that is not a valid `YYYY-MM` or `YYYY-MM-DD` calendar date.

#### Scenario: A date field is malformed
- **WHEN** validation runs against an experience file whose date field is not a real calendar date in `YYYY-MM` or `YYYY-MM-DD` form
- **THEN** the result is invalid and includes an error naming that file and field

#### Scenario: A date field is a valid year-month or full date
- **WHEN** validation runs against an experience file whose date fields are valid `YYYY-MM` or `YYYY-MM-DD` calendar dates
- **THEN** no malformed-date error is reported for that file

### Requirement: Valid content passes
When every file under `/content` satisfies its schema and every evidence reference resolves, the validator SHALL report a valid result with no errors.

#### Scenario: All content is valid
- **WHEN** validation runs against a fully valid `/content` tree
- **THEN** the result is valid and the errors list is empty

### Requirement: All errors collected in one pass
The validator SHALL accumulate every detected issue across the full `/content` tree into a single result rather than stopping at the first failure.

#### Scenario: Multiple unrelated issues exist
- **WHEN** validation runs against content containing both a missing required field in one file and a dangling reference in another
- **THEN** the result includes an error for each issue, not only the first one encountered

### Requirement: CLI exit code contract
A command-line entry point SHALL run the validator, print each error naming its file and (when applicable) field, and exit non-zero if any error was found, or zero otherwise.

#### Scenario: CLI run against invalid content
- **WHEN** the CLI entry point runs against content containing at least one validation error
- **THEN** it prints each error and exits with a non-zero status code

#### Scenario: CLI run against valid content
- **WHEN** the CLI entry point runs against fully valid content
- **THEN** it prints nothing and exits with status code zero
