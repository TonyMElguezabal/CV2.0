## ADDED Requirements

### Requirement: A persistent header frames every page view
The site SHALL render a persistent header containing a brand wordmark, navigation to the page's major sections, and a contact action. The header SHALL remain visible or reachable as the visitor scrolls, so the page always presents a frame rather than free-scrolling content. It SHALL be a `<header>` landmark, and its navigation SHALL be a `<nav>` landmark with an accessible name that distinguishes it from any other navigation on the page.

#### Scenario: The header is present and framed
- **WHEN** the landing page is rendered
- **THEN** a `<header>` landmark is present containing a brand wordmark, section navigation, and a contact action

#### Scenario: Multiple navigation landmarks are distinguishable
- **WHEN** the page's navigation landmarks are enumerated by assistive technology
- **THEN** each has its own accessible name, so the header navigation and the career timeline are told apart rather than both announced as "navigation"

#### Scenario: The header persists while scrolling
- **WHEN** the visitor scrolls down the page
- **THEN** the header remains visible or reachable rather than scrolling permanently out of reach

### Requirement: Every navigable section has a stable anchor target
Each section the header navigates to SHALL expose a stable `id` on the section element, and each header navigation link SHALL be a real anchor whose `href` is a fragment matching one of those ids. Navigation SHALL work using native anchor behavior alone, without JavaScript.

#### Scenario: Navigation targets resolve
- **WHEN** each header navigation link's `href` is inspected
- **THEN** it is a fragment link matching the `id` of a section that exists in the document

#### Scenario: Navigation works without JavaScript
- **WHEN** a visitor activates a header navigation link with JavaScript disabled
- **THEN** the browser navigates to the corresponding section using native anchor-link behavior alone

### Requirement: Fixed chrome does not obscure the targets it navigates to
Because the header occupies the top of the viewport, every anchor destination on the page SHALL reserve enough scroll clearance that activating a link leaves the destination visible below the fixed chrome rather than beneath it. This SHALL apply to every anchor destination — header navigation targets, career timeline targets, and the skip link's main-content target — not only to the ones the header itself links to.

#### Scenario: A header navigation link is activated
- **WHEN** a visitor activates a header navigation link
- **THEN** the destination section's heading is visible below the header, not hidden underneath it

#### Scenario: A timeline node is activated
- **WHEN** a visitor activates a career timeline node
- **THEN** the destination chapter is visible below the header, not hidden underneath it

#### Scenario: The skip link is activated
- **WHEN** a keyboard visitor activates the skip-to-content link
- **THEN** focus moves to the main content region and that region is visible below the header, not hidden underneath it

### Requirement: The skip link remains first and remains visible
The skip-to-content link SHALL remain the first focusable element in the document, and SHALL remain visible when focused despite the presence of fixed header chrome — the header SHALL NOT obscure or stack above it.

#### Scenario: Tab order still begins with the skip link
- **WHEN** a keyboard user presses Tab on a freshly loaded page
- **THEN** the first focusable element is the skip-to-content link, ahead of any header navigation link

#### Scenario: The focused skip link is not hidden by the header
- **WHEN** the skip-to-content link receives focus
- **THEN** it is visibly rendered and is not covered by, or stacked beneath, the fixed header

### Requirement: The grid overlay is decorative only
The site SHALL render a decorative grid of hairlines as part of the frame. It SHALL be non-interactive, SHALL be hidden from assistive technology, SHALL NOT intercept pointer events, and SHALL NOT carry text. Its hairline color SHALL come from the palette tint designated for borders and rules rather than from a text tint.

#### Scenario: The grid is inert
- **WHEN** the grid overlay is rendered
- **THEN** it is hidden from assistive technology, does not receive focus, and does not intercept pointer events from the content beneath it

#### Scenario: The grid carries no text
- **WHEN** the grid overlay is inspected
- **THEN** it contains no text content, so the borders-only palette tint it uses is never applied to text

### Requirement: The frame introduces no second scroll-position indicator
The frame SHALL NOT add a scroll-position or progress indicator of its own. The career timeline is the site's single indicator of position within the document, and any progress affordance in the frame SHALL be served by it rather than duplicated alongside it.

#### Scenario: Only one position indicator exists
- **WHEN** the page's fixed elements are inspected at a desktop viewport
- **THEN** exactly one component indicates the visitor's position within the document, and it is the career timeline

### Requirement: The frame adapts on small viewports without trapping content
On small viewports the frame SHALL adapt rather than persist unchanged, so that fixed chrome does not consume a disproportionate share of a short viewport or overlap page content. Section navigation SHALL remain reachable at every viewport width, and the grid overlay SHALL NOT reduce content legibility on small screens.

#### Scenario: Small viewport chrome is proportionate
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the frame's fixed chrome does not overlap page content or consume a disproportionate share of the viewport height

#### Scenario: Navigation stays reachable on small viewports
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the section navigation remains reachable and keyboard-operable, rather than being removed from the document or the tab order
