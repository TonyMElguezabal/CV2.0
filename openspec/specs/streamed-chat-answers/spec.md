## Purpose

Defines the `POST /api/chat` HTTP surface: streaming a grounded answer token-by-token and delivering deduplicated, anchor-linked source citations once the answer completes.

## Requirements

### Requirement: Answer streams token-by-token over HTTP
The system SHALL expose a `POST /api/chat` endpoint that streams the generated answer to the client as it's produced, rather than waiting for full completion.

#### Scenario: A valid question is submitted
- **WHEN** a client sends `POST /api/chat` with a valid, non-empty question
- **THEN** the response streams `token` events containing successive pieces of the answer as they are generated, rather than a single complete response

### Requirement: Citations deep-link to the source anchor
The system SHALL include, once the answer completes, a deduplicated list of the site anchors the answer drew from, using the chunk metadata established in 5.2a.

#### Scenario: The answer stream completes
- **WHEN** the token stream for a request finishes
- **THEN** a `citations` event is sent containing the deduplicated `{ source, chapterId, anchor }` entries for the chunks retrieved for that question, followed by a `done` event

### Requirement: Request is validated at the API boundary
The system SHALL reject malformed or empty requests before performing any retrieval or generation work.

#### Scenario: Empty or missing question
- **WHEN** `POST /api/chat` is sent with an empty, missing, or over-length `question` field
- **THEN** the endpoint responds with a 4xx status and does not perform retrieval, embedding, or generation

#### Scenario: Malformed JSON body
- **WHEN** `POST /api/chat` is sent with a body that is not valid JSON
- **THEN** the endpoint responds with a 4xx status without making any external API call

### Requirement: Streaming orchestration is testable without live API calls
The system SHALL support unit-testing the retrieval-and-streaming orchestration using injected fake dependencies, with no real network calls.

#### Scenario: Unit test with a fake streaming provider
- **WHEN** `streamGroundedAnswer` is called with an injected fake embeddings client, a fixed in-memory index, and a fake `LlmProvider` whose `generateStream` yields fixed chunks
- **THEN** it returns the retrieved chunks immediately and an async generator that yields those exact chunks, without making any real API call
