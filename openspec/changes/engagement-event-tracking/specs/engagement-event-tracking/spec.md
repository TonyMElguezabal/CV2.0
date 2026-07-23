## ADDED Requirements

### Requirement: Opening the chat records a chat-open event
The system SHALL record a `chat_open` event whenever the chat widget is opened, regardless of which entry point triggered it.

#### Scenario: The chat widget is opened
- **WHEN** the chat widget is opened via any entry point (the persistent trigger or the hero "Ask AI" CTA)
- **THEN** a `chat_open` event is recorded

### Requirement: Asking a question records a count-only event
The system SHALL record a `question_asked` event when a chat question is submitted, carrying only the event type and timestamp and NEVER the question's text.

#### Scenario: A question is submitted
- **WHEN** a visitor submits a chat question
- **THEN** a `question_asked` event is recorded with no field carrying the question text

#### Scenario: The tracking call is inspected
- **WHEN** the `question_asked` tracking call is made
- **THEN** it is invoked with no argument containing the question's text

### Requirement: Résumé download and contact clicks record conversion events
The system SHALL record a `resume_download` event when the résumé link is activated and a `contact_click` event (carrying which channel) when a contact link is activated.

#### Scenario: The résumé link is activated
- **WHEN** a visitor activates the résumé download link
- **THEN** a `resume_download` event is recorded

#### Scenario: A contact link is activated
- **WHEN** a visitor activates a contact link
- **THEN** a `contact_click` event is recorded, carrying `contactTarget` as the channel used (`scheduling`, `email`, or `linkedin`)

### Requirement: Tracking does not alter the interactions it observes
The system SHALL record engagement events as an additive side effect, without changing the observed interaction's own behavior.

#### Scenario: A tracked interaction occurs
- **WHEN** any tracked interaction occurs (chat open, question submit, résumé download, contact click)
- **THEN** the interaction completes its normal behavior (the widget opens, the answer streams, the résumé downloads, the contact link navigates) whether or not the tracking event succeeds
