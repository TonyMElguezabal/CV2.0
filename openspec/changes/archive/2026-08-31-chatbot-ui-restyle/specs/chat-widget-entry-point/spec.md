## ADDED Requirements

### Requirement: The trigger presents as an icon while keeping its accessible name
The chat trigger SHALL render as an icon with no visible text label, and SHALL retain the accessible name "Ask about Jose". The icon itself SHALL be hidden from assistive technology, and the trigger SHALL remain a real `<button>`.

This exists because an icon-only control with no accessible name is a WCAG 4.1.2 failure, and removing the visible label removes the trigger's accessible name unless one is supplied explicitly.

#### Scenario: Assistive technology reaches the icon trigger
- **WHEN** the chat trigger is reached by assistive technology
- **THEN** it is exposed as a button named "Ask about Jose", and the icon artwork is not announced

#### Scenario: The trigger is operated by keyboard
- **WHEN** the visitor focuses the trigger and activates it by keyboard
- **THEN** the chat panel opens, exactly as it does on click

### Requirement: The trigger meets non-text contrast against the page
The trigger's icon SHALL meet at least 3:1 contrast against the trigger's own background, and the trigger SHALL remain visible at every scroll position and viewport width.

#### Scenario: The trigger's icon contrast is measured
- **WHEN** the trigger's icon colour is measured against the filled background it renders on
- **THEN** it achieves at least 3:1

#### Scenario: The visitor scrolls the page
- **WHEN** the visitor scrolls to any position on the page
- **THEN** the trigger remains visible and operable without scrolling back

### Requirement: The bot artwork is served as a static asset
The bot artwork SHALL be served from the site's static assets at its display resolution, and SHALL NOT be embedded in the JavaScript bundle as inline encoded data.

This exists because the source mockup inlines the artwork as roughly 181 KB of base64, which would enter the initial bundle and consume most of the site's remaining performance headroom.

#### Scenario: The artwork's delivery is inspected
- **WHEN** the bot artwork's delivery mechanism is inspected
- **THEN** it resolves to a static asset request, not to encoded image data inside a JavaScript or CSS bundle

#### Scenario: The initial bundle is measured
- **WHEN** the initial JavaScript payload is measured after the restyle
- **THEN** it remains within the site's documented regression threshold

### Requirement: The bot's animation is transform-only and reduced-motion-safe
The bot's saluting animation SHALL animate only compositor-friendly properties, and SHALL render the bot at rest with no looping animation when the visitor has `prefers-reduced-motion: reduce` set.

This exists because a continuously looping animation longer than five seconds running alongside content is WCAG 2.2.2 territory; the reduced-motion guard is the accepted mitigation.

#### Scenario: The animation's properties are inspected
- **WHEN** the bot's animation is inspected
- **THEN** it animates only transform properties, driving no layout or paint

#### Scenario: Reduced motion preferred
- **WHEN** the bot is rendered with `prefers-reduced-motion: reduce` set
- **THEN** the arm renders in its rest position and no looping animation runs

## MODIFIED Requirements

Note: the tooltip itself (`### Requirement: Trigger shows a hover/focus tooltip`) is **unchanged by this delta** — the owner asked to keep its existing `🤖` emoji as-is, so that requirement is not listed here. Only "Tooltip is decorative and non-interfering" changes, and only to extend its assistive-technology guard to the trigger's *own* new icon artwork alongside the tooltip's existing emoji.

### Requirement: Tooltip is decorative and non-interfering
The tooltip SHALL be decorative and SHALL NOT change the trigger's accessible name, obscure or block page content, or trap keyboard focus. The tooltip's robot emoji SHALL be hidden from assistive technology, and the trigger's own icon artwork SHALL likewise be hidden from assistive technology.

#### Scenario: Assistive technology encounters the trigger
- **WHEN** the chat trigger is reached by assistive technology
- **THEN** the trigger keeps its accessible name ("Ask about Jose"), and neither the tooltip's decorative emoji nor the trigger's own icon artwork is announced

#### Scenario: Tooltip does not block interaction
- **WHEN** the tooltip is shown
- **THEN** page content behind and around it remains visible and interactive, and no keyboard focus trap is introduced

### Requirement: Panel shows an animated greeting on open
The system SHALL show a prominent greeting when the panel is opened with no prior messages, positioned above the FAQ starter questions and animated so its characters appear progressively, as though being typed. The greeting text SHALL be sourced from the site's content, not hardcoded in components. The full greeting text SHALL be present in the document from the moment it is rendered, with only the appearance of each character animated — the animation SHALL NOT progressively insert text into the document.

This construction exists because progressive insertion causes assistive technology to announce a partial, shifting string; animating the appearance of already-present text leaves a single, complete string to announce.

#### Scenario: Panel opened with no prior messages
- **WHEN** the panel is opened and no messages have been sent yet
- **THEN** the content-sourced greeting is displayed above the starter questions, with its characters appearing progressively

#### Scenario: Assistive technology encounters the greeting
- **WHEN** assistive technology reaches the greeting
- **THEN** it announces the complete greeting text as a single string, and does not encounter the per-character markup

#### Scenario: The greeting text is complete in the document while animating
- **WHEN** the greeting is mid-animation
- **THEN** its full text is already present in the document, with only per-character appearance still animating

### Requirement: Tooltip and greeting respect reduced motion
The tooltip, greeting, bot animation, and idle invitation SHALL show their final state with no motion when the visitor has `prefers-reduced-motion: reduce` set, and their addition SHALL preserve the widget's non-modal behavior and the close button receiving focus on open.

#### Scenario: Reduced motion preferred
- **WHEN** the tooltip or greeting appears with `prefers-reduced-motion: reduce` set
- **THEN** it is shown in its final state with no fade, slide, or per-character animation

#### Scenario: Reduced motion applies to the bot and invitation
- **WHEN** the bot or the idle invitation is rendered with `prefers-reduced-motion: reduce` set
- **THEN** the bot renders at rest and the invitation appears with no entrance animation

#### Scenario: Non-modal behavior preserved
- **WHEN** the greeting is shown on open
- **THEN** the widget remains non-modal (no backdrop, scroll lock, or focus trap) and the close button receives focus
