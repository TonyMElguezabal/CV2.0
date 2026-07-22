## ADDED Requirements

### Requirement: Answers are grounded in retrieved content
The system SHALL generate answers to profile-related questions using only content retrieved from the indexed corpus for that question.

#### Scenario: A question covered by profile content
- **WHEN** a question whose answer exists in the indexed content is submitted
- **THEN** the generated answer is grounded in the chunks retrieved for that question, per the system-prompt contract

### Requirement: Graceful refusal when content doesn't cover the question
The system SHALL state clearly when a question cannot be answered from the retrieved content and suggest an alternative, without inferring or embellishing skills, dates, or outcomes.

#### Scenario: A plausible but uncovered question
- **WHEN** a professionally-plausible question is submitted whose answer is not present in the retrieved content
- **THEN** the generated answer says it cannot answer from the available information and suggests what the visitor could ask instead, without fabricating specifics

### Requirement: Answers follow the voice and length contract
The system SHALL generate answers that speak about the subject in third person, target under 150 words, and offer to go deeper.

#### Scenario: Any generated answer
- **WHEN** an answer is generated for any question in the eval sample
- **THEN** it refers to the subject in third person, and its live-verified length and content reflect the under-150-word, offer-to-go-deeper contract from the system prompt

### Requirement: Generation is testable without live API calls
The system SHALL support fully unit-testing the retrieve-and-generate flow using injected fake dependencies, with no real network calls.

#### Scenario: Unit test with fake embedding client, index, and provider
- **WHEN** `generateGroundedAnswer` is called with an injected fake embeddings client, a fixed in-memory index, and a fake `LlmProvider`
- **THEN** it returns an answer and the retrieved chunks without making any real API call
