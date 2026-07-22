## ADDED Requirements

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
