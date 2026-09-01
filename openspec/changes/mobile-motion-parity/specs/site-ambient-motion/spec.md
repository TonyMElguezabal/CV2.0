## RENAMED Requirements

- FROM: `### Requirement: The ambient layer is omitted on small viewports and without JavaScript`
- TO: `### Requirement: The ambient layer is omitted without JavaScript`

## MODIFIED Requirements

### Requirement: The ambient layer is omitted without JavaScript
Without JavaScript the ambient layer SHALL simply be absent, and its absence SHALL have no effect on the readability or completeness of the page. The layer SHALL otherwise render at every viewport width — its cost on constrained devices is bounded by the requirements it already carries (a viewport-area-derived particle count, and an animation loop that stops whenever the layer is not visible) rather than by omitting it below a breakpoint.

#### Scenario: JavaScript disabled
- **WHEN** the page is loaded with JavaScript disabled
- **THEN** the ambient layer renders nothing, and all page content remains fully readable and complete without it

#### Scenario: Small viewport
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the ambient layer renders and animates, with its particle count derived from the smaller area rather than the layer being omitted
