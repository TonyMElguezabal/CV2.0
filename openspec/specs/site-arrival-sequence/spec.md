## Purpose

Defines the site's page-load arrival sequence — the orchestrated first ~2
seconds in which the hero's elements enter in a deliberate, overlapping
order derived from the site's shared motion pace, rather than each element
animating independently. Covers its bounded duration, non-blocking
interactivity, deep-link skip behavior, no-persistence convention,
reduced-motion fallback, and single-ownership boundary with the site's
scroll-reveal system.

## Requirements

### Requirement: The page plays one orchestrated arrival sequence on load
On load, the site SHALL play a single orchestrated arrival sequence in which its elements enter in a deliberate order with overlapping timing, rather than each element animating independently on its own schedule. Every step's timing SHALL derive from the site's shared motion pace token, so the sequence reads as one movement.

#### Scenario: Elements arrive in order
- **WHEN** the landing page is loaded with no `prefers-reduced-motion` preference
- **THEN** its elements enter in a defined order with overlapping timing, rather than all beginning simultaneously or each on an unrelated schedule

#### Scenario: The sequence shares one rhythm
- **WHEN** the arrival sequence's step timings are inspected
- **THEN** each derives from the site's shared motion pace token rather than being independently specified per component

#### Scenario: Non-text steps precede text steps
- **WHEN** the arrival sequence plays
- **THEN** steps that do not depend on the site's webfonts begin before the steps that render display type, so the sequence has begun visibly before any font-dependent step runs

### Requirement: The arrival sequence is bounded and never blocks reading or interaction
The sequence SHALL complete within a bounded duration, after which all content is in its final state. It SHALL NOT make the page inert while it plays: links, buttons, and other controls SHALL be operable as soon as they are rendered rather than waiting for the sequence to finish. It SHALL NOT wait indefinitely on any external condition, including webfont loading.

#### Scenario: The sequence completes
- **WHEN** the arrival sequence has finished
- **THEN** every participating element is in its final visible state, with no element left faded, offset, or otherwise mid-animation

#### Scenario: The page is interactive during the sequence
- **WHEN** a visitor activates a link or button while the arrival sequence is still playing
- **THEN** it responds immediately rather than being blocked until the sequence completes

#### Scenario: The sequence does not stall on webfonts
- **WHEN** the site's webfonts have not finished loading at the moment a font-dependent step is due
- **THEN** the sequence proceeds rather than waiting indefinitely for them

#### Scenario: The sequence fails to run
- **WHEN** the arrival sequence does not run for any reason — a scripting error, an unsupported browser, or JavaScript disabled
- **THEN** all content renders directly in its final visible state, with nothing left hidden or offset

### Requirement: Deep-linked arrivals skip the sequence
When the page is loaded with a URL fragment targeting an element within the document, the arrival sequence SHALL be skipped or reduced, because the browser is navigating to a different part of the page and a hero-centred choreography would be both unseen and inappropriate. Content SHALL render in its final state in that case.

#### Scenario: Arrival at a deep link
- **WHEN** the page is loaded with a URL fragment targeting a section within the document
- **THEN** the arrival sequence does not play its full choreography, and the targeted section and the rest of the page render in their final state

#### Scenario: Arrival with no fragment
- **WHEN** the page is loaded with no URL fragment
- **THEN** the arrival sequence plays normally

### Requirement: The sequence plays on every load and persists nothing
The sequence SHALL play on each page load and SHALL NOT record whether it has previously played. It SHALL write no cookie and no client storage of any kind, consistent with the site's established convention of persisting nothing on the client.

#### Scenario: Repeat visit
- **WHEN** a visitor loads the page again in the same browser
- **THEN** the arrival sequence plays again, and no stored value was read or written to decide that

#### Scenario: No client storage is written
- **WHEN** the arrival sequence runs
- **THEN** it writes no `document.cookie`, no `localStorage`, and no `sessionStorage`

### Requirement: The sequence collapses to a fade under reduced motion
When the visitor has `prefers-reduced-motion: reduce` set, the arrival sequence SHALL drop all movement — no positional entrance, no ordered choreography of moving parts — leaving an opacity fade only, consistent with the site-wide reduced-motion alternative. It SHALL NOT play the same movement over a longer duration.

#### Scenario: Reduced motion preferred
- **WHEN** the page is loaded with `prefers-reduced-motion: reduce` set
- **THEN** content fades in with no positional movement, and reaches its final visible state

#### Scenario: Reduced motion is not merely slowed
- **WHEN** the page is loaded with `prefers-reduced-motion: reduce` set
- **THEN** movement is removed rather than stretched over a longer duration

### Requirement: Each element's entrance is owned by exactly one motion system
An element that participates in the arrival sequence SHALL NOT also be animated by the site's scroll-reveal system, so that no element is animated twice or animated into conflicting states. The site's ambient motion layer, where present, SHALL enter as a step of the arrival sequence rather than appearing abruptly alongside it.

#### Scenario: The hero is not double-animated
- **WHEN** the hero's entrance is inspected
- **THEN** it is driven by the arrival sequence and not additionally by a scroll-triggered reveal

#### Scenario: Ambient motion enters with the sequence
- **WHEN** the ambient motion layer is present and the arrival sequence plays
- **THEN** the ambient layer becomes visible as a step of the sequence rather than appearing independently of it

#### Scenario: The sequence tolerates absent participants
- **WHEN** the arrival sequence runs on a page where an expected participant is not present
- **THEN** the sequence choreographs the participants that do exist and completes normally
