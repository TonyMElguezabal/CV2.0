## ADDED Requirements

### Requirement: Trigger shows a hover/focus tooltip
The system SHALL show a small tooltip when the visitor hovers or keyboard-focuses the chat trigger while the panel is closed. The tooltip SHALL present a decorative robot emoji and the label "chat with me", SHALL dismiss on blur or mouse-leave, and SHALL NOT be shown while the panel is open. The tooltip text and label SHALL be sourced from the site's content, not hardcoded in components.

#### Scenario: Hovering the trigger
- **WHEN** the panel is closed and the visitor hovers the chat trigger
- **THEN** a tooltip appears showing a robot emoji and the label "chat with me"

#### Scenario: Keyboard-focusing the trigger
- **WHEN** the panel is closed and the visitor moves keyboard focus to the chat trigger
- **THEN** the same tooltip appears

#### Scenario: Tooltip dismissed
- **WHEN** the visitor moves the mouse away from the trigger or the trigger loses focus
- **THEN** the tooltip is no longer shown

#### Scenario: Tooltip hidden while open
- **WHEN** the chat panel is open
- **THEN** the trigger's tooltip is not shown

### Requirement: Tooltip is decorative and non-interfering
The tooltip SHALL be decorative and SHALL NOT change the trigger's accessible name, obscure or block page content, or trap keyboard focus. The robot emoji SHALL be hidden from assistive technology.

#### Scenario: Assistive technology encounters the trigger
- **WHEN** the chat trigger is reached by assistive technology
- **THEN** the trigger keeps its accessible name ("Ask about Jose") and the decorative robot is not announced

#### Scenario: Tooltip does not block interaction
- **WHEN** the tooltip is shown
- **THEN** page content behind and around it remains visible and interactive, and no keyboard focus trap is introduced

### Requirement: Panel shows an animated greeting on open
The system SHALL show a prominent greeting when the panel is opened with no prior messages, positioned above the FAQ starter questions and animated with a fade and slide-in entrance. The greeting text SHALL be sourced from the site's content, not hardcoded in components.

#### Scenario: Panel opened with no prior messages
- **WHEN** the panel is opened and no messages have been sent yet
- **THEN** the content-sourced greeting is displayed above the starter questions with a fade + slide-in animation

### Requirement: Greeting is intro-only
The greeting SHALL be shown only before the conversation begins; once the visitor sends the first message (starter or free-text), the greeting SHALL no longer be shown.

#### Scenario: First message sent
- **WHEN** the visitor sends the first message (by selecting a starter question or submitting free text)
- **THEN** the greeting is no longer shown

### Requirement: Tooltip and greeting respect reduced motion
The tooltip and greeting SHALL show their final state with no motion when the visitor has `prefers-reduced-motion: reduce` set, and their addition SHALL preserve the widget's non-modal behavior and the close button receiving focus on open.

#### Scenario: Reduced motion preferred
- **WHEN** the tooltip or greeting appears with `prefers-reduced-motion: reduce` set
- **THEN** it is shown in its final state with no fade or slide animation

#### Scenario: Non-modal behavior preserved
- **WHEN** the greeting is shown on open
- **THEN** the widget remains non-modal (no backdrop, scroll lock, or focus trap) and the close button receives focus
