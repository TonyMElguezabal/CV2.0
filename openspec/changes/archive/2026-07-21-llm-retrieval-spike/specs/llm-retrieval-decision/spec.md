## ADDED Requirements

### Requirement: Comparative provider prototype
The system SHALL run the same small eval sample against two candidate LLM providers (Claude and GPT) using the same retrieval approach and real content, so the provider decision is evidence-based.

#### Scenario: Both candidate providers answer the same eval sample
- **WHEN** each candidate provider is run against the eval sample
- **THEN** it produces answers grounded in retrieved chunks from the real `/content` corpus, using the same chunking, embedding, and retrieval pipeline for both

### Requirement: Recorded provider and retrieval decision
The system SHALL select exactly one LLM provider and exactly one retrieval approach, with rationale documented referencing the comparative prototype.

#### Scenario: A decision is recorded
- **WHEN** the spike concludes
- **THEN** exactly one provider (Claude or GPT) and exactly one retrieval approach (from §7's three options) are selected, with rationale documented referencing the eval-sample comparison and measured real chunk count

#### Scenario: The losing provider implementation is removed
- **WHEN** the decision is recorded
- **THEN** the non-selected provider's SDK dependency and implementation code are removed from the codebase, not left as dead code

### Requirement: Cost impact recorded against the PRD §10 budget
The system SHALL project monthly cost for the selected provider against a documented traffic assumption, and record whether it fits within §10's <$50/month budget criterion.

#### Scenario: Cost projection is recorded
- **WHEN** the spike concludes
- **THEN** the spike report records a projected monthly cost for the selected provider, the traffic assumption it's based on, and whether that projection fits the <$50/month budget

### Requirement: Thin-adapter constraint is confirmed intact
The system SHALL demonstrate that the LLM provider can be swapped by editing a single file, per §8's adapter constraint.

#### Scenario: Provider swap requires one file edit
- **WHEN** the adapter implementation is inspected after the decision
- **THEN** switching the active provider requires editing exactly one file, with no changes needed elsewhere in the codebase

### Requirement: Spike does not ship chatbot-facing surfaces
The spike SHALL NOT include the `/api/chat` endpoint, rate limiting, or any chat widget UI — those remain scoped to later chatbot stories (5.1–5.6).

#### Scenario: No chat endpoint or widget exists after the spike
- **WHEN** the repository is inspected after this change
- **THEN** no `/api/chat` route and no chat widget component exist yet
