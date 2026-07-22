## MODIFIED Requirements

### Requirement: Thin-adapter constraint is confirmed intact
The system SHALL demonstrate that the LLM provider can be swapped by editing a single file, per §8's adapter constraint, for both non-streaming and streaming generation.

#### Scenario: Provider swap requires one file edit
- **WHEN** the adapter implementation is inspected after the decision
- **THEN** switching the active provider requires editing exactly one file, with no changes needed elsewhere in the codebase

#### Scenario: Streaming generation is part of the shared adapter interface
- **WHEN** the `LlmProvider` interface is inspected after streaming support is added
- **THEN** streaming generation (`generateStream`) is declared on the same shared interface as non-streaming generation (`generate`), so a future provider swap doesn't need to special-case the streaming path
