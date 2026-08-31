## ADDED Requirements

### Requirement: An idle invitation invites the visitor to start a conversation
The system SHALL show a brief invitation bubble near the chat trigger after a period of visitor inactivity, introducing the assistant by name, so a visitor who has not noticed the trigger is offered the conversation rather than having to discover it.

#### Scenario: The visitor has not interacted with the chat
- **WHEN** the visitor has not opened the chat and the idle interval elapses
- **THEN** an invitation bubble appears near the trigger, introducing the assistant by name

#### Scenario: The invitation copy is content-sourced
- **WHEN** the invitation's text is traced to its source
- **THEN** it resolves to a field in the site's content, not to a string literal in a component

### Requirement: The invitation appears on a varied, repeating cadence
The invitation SHALL appear on a randomised interval of between one and five minutes, and SHALL continue to reappear on that cadence until the visitor opens the chat, so the invitation is neither predictable nor a single missable event.

#### Scenario: The interval is randomised within bounds
- **WHEN** the delay before an invitation is scheduled
- **THEN** it falls between one and five minutes

#### Scenario: The invitation repeats while the chat stays unopened
- **WHEN** an invitation has appeared and been dismissed, and the visitor still has not opened the chat
- **THEN** a further invitation is scheduled on the same randomised cadence

#### Scenario: The visitor opens the chat
- **WHEN** the visitor opens the chat at any point
- **THEN** no further invitation is scheduled or shown for the remainder of the session

### Requirement: The invitation's suppression lasts exactly one session
Once the visitor has opened the chat, the system SHALL suppress further invitations for the remainder of the browsing session, and SHALL allow them again on a subsequent visit. Suppression state SHALL be scoped to the session and SHALL NOT be written to a cookie or transmitted to the server.

#### Scenario: The visitor returns later in the same session
- **WHEN** the visitor has opened the chat earlier in the session and continues browsing
- **THEN** no invitation appears again during that session

#### Scenario: The visitor returns in a new session
- **WHEN** the visitor loads the site in a new browsing session having opened the chat in a previous one
- **THEN** invitations are eligible to appear again

#### Scenario: Suppression state carries no personal data
- **WHEN** the stored suppression state is inspected
- **THEN** it records only whether the chat has been opened, is scoped to the session, and is never sent to the server

### Requirement: The invitation never disrupts keyboard or assistive-technology users
The invitation SHALL NOT move keyboard focus when it appears, SHALL NOT trap focus, and SHALL NOT prevent the visitor from continuing whatever they were doing.

This exists because a timer-driven popup that takes focus interrupts a keyboard or screen-reader user mid-task with no action on their part.

#### Scenario: The invitation appears while the visitor is typing elsewhere
- **WHEN** an invitation appears while keyboard focus is on another element
- **THEN** focus remains where it was and is not moved to the invitation or the trigger

#### Scenario: The visitor continues keyboard navigation
- **WHEN** an invitation is showing and the visitor navigates by keyboard
- **THEN** no focus trap is introduced and every other page control remains reachable

### Requirement: The invitation is dismissible and self-limiting
Each appearance of the invitation SHALL be dismissible, and SHALL NOT persist indefinitely on screen.

#### Scenario: The visitor dismisses an invitation
- **WHEN** the visitor dismisses a showing invitation
- **THEN** it is removed from view, and the trigger remains fully usable

### Requirement: The invitation pauses while the page is not being viewed
The system SHALL NOT show an invitation while the document is hidden, and SHALL resume its cadence when the document becomes visible again.

This exists because an invitation that fires into a backgrounded tab is spent without ever being seen.

#### Scenario: The tab is hidden when the interval would elapse
- **WHEN** the document is hidden and the scheduled interval elapses
- **THEN** no invitation is shown while the document remains hidden

#### Scenario: The visitor returns to the tab
- **WHEN** the document becomes visible again
- **THEN** the invitation cadence resumes

### Requirement: The invitation cleans up after itself
The system SHALL clear any pending invitation timer when the widget unmounts, so no timer outlives the component that scheduled it.

#### Scenario: The widget unmounts with a timer pending
- **WHEN** the chat widget unmounts while an invitation is scheduled
- **THEN** the pending timer is cleared and does not fire

### Requirement: The invitation respects reduced motion
The invitation SHALL appear in its final state with no entrance animation when the visitor has `prefers-reduced-motion: reduce` set.

#### Scenario: Reduced motion preferred
- **WHEN** an invitation appears with `prefers-reduced-motion: reduce` set
- **THEN** it is shown in its final state with no fade, slide, or other entrance animation
