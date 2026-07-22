## Purpose

Defines how a visitor's question becomes a grounded answer: retrieving matching content from the index and generating a response that stays within it, refuses gracefully when it can't, and follows PRD §7's voice/length/depth-offer contract.

## Requirements

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

### Requirement: Clearly off-topic questions are declined without calling the LLM
The system SHALL decline a question deterministically, without calling the LLM provider, when no chunk retrieved for that question meets a minimum relevance threshold — distinct from the existing soft refusal for professionally-plausible-but-uncovered questions, which still reaches the LLM.

#### Scenario: A clearly off-topic question
- **WHEN** a question is submitted whose best-matching retrieved chunk does not meet the configured relevance threshold
- **THEN** the response is the canonical off-topic refusal ("I can only answer questions about Jose's professional background"), no citations are returned, and the LLM provider's `generate`/`generateStream` is never called

#### Scenario: A question that clears the relevance threshold
- **WHEN** a question is submitted whose best-matching retrieved chunk meets or exceeds the configured relevance threshold
- **THEN** generation proceeds as normal via the LLM provider, unaffected by this guard

#### Scenario: Unit test with fake embeddings, no live calls
- **WHEN** `generateGroundedAnswer`/`streamGroundedAnswer` are exercised with an injected fake embeddings client and a fixed in-memory index whose top match falls below the relevance threshold
- **THEN** the fake `LlmProvider`'s `generate`/`generateStream` is never invoked, and the returned answer is the canonical off-topic refusal
