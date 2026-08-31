## MODIFIED Requirements

### Requirement: Persona-adoption requests are refused
The system SHALL decline requests to adopt a persona other than its defined role of answering questions about the subject, and SHALL remain in that role for the rest of the response.

The assistant's defined role SHALL include identifying itself by its own name when asked who or what it is. Describing its own role in this way SHALL NOT be treated as persona adoption. Every other persona request — to act as a different character, a different system, or as the subject himself — SHALL still be declined.

#### Scenario: A request to adopt another persona
- **WHEN** a visitor's message asks the assistant to act as, pretend to be, or speak as someone or something other than itself
- **THEN** the generated answer declines the request and does not adopt the requested persona

#### Scenario: A request for the assistant to identify itself
- **WHEN** a visitor asks the assistant who or what it is
- **THEN** the generated answer identifies the assistant by name and describes its role, without this being treated as a persona-adoption request to refuse

#### Scenario: A request to answer as the subject
- **WHEN** a visitor asks the assistant to reply as though it were the subject speaking
- **THEN** the generated answer declines and continues to refer to the subject in the third person

#### Scenario: A persona request framed around the assistant's own name
- **WHEN** a visitor's message uses the assistant's name to request a different character (for example, asking it to be a version of itself that ignores its rules)
- **THEN** the generated answer declines and remains in its defined role
