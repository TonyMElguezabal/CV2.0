## Purpose

Defines the hero's call-to-action row (primary scroll affordance + Ask AI / Download résumé / Contact secondary CTAs), their real content sourcing, and the guarantee that hero content remains readable with JavaScript disabled.

## Requirements

### Requirement: Hero renders name, role, and positioning within the first viewport
The hero SHALL display the profile's name and positioning statement, sourced from `content/profile.yaml` via `getProfile()`, fully within the first viewport without requiring the visitor to scroll.

#### Scenario: First visit, default viewport
- **WHEN** a visitor loads the page for the first time on a standard desktop or mobile viewport
- **THEN** the profile's name and positioning statement are visible without scrolling

### Requirement: Hero renders a primary scroll CTA and three secondary CTAs
The hero SHALL render one primary call-to-action that invites scrolling, and three secondary calls to action: Ask AI, Download résumé, and Contact.

#### Scenario: CTA row renders
- **WHEN** the hero is rendered
- **THEN** a primary CTA inviting scrolling is present, and three secondary CTAs labeled Ask AI, Download résumé, and Contact are present

### Requirement: Download résumé CTA links to a real file
The "Download résumé" CTA SHALL link to a real, downloadable résumé PDF served from the site, not a placeholder or dead link.

#### Scenario: Résumé CTA activated
- **WHEN** a visitor activates the "Download résumé" CTA
- **THEN** the browser downloads a valid PDF file

### Requirement: Contact CTA leads to the contact section
The "Contact" CTA SHALL scroll the visitor to the page's contact section (`#contact`) rather than opening an email client directly, so the visitor lands on the full set of contact options.

#### Scenario: Contact CTA activated
- **WHEN** a visitor activates the "Contact" CTA
- **THEN** the page scrolls to the `#contact` contact section

### Requirement: Ask AI CTA opens the chat widget
The "Ask AI" CTA SHALL be a visibly enabled control that opens the chat widget when activated, since the chatbot feature now exists.

#### Scenario: Ask AI CTA rendered
- **WHEN** the hero is rendered
- **THEN** the "Ask AI" CTA is visible and enabled

#### Scenario: Ask AI CTA activated
- **WHEN** a visitor activates the "Ask AI" CTA
- **THEN** the chat widget opens

### Requirement: Hero content remains readable with JavaScript disabled
All hero content — name, positioning, and CTA labels — SHALL remain fully readable when JavaScript is disabled in the visitor's browser.

#### Scenario: JavaScript disabled
- **WHEN** a visitor loads the hero page with JavaScript disabled
- **THEN** the name, positioning statement, and all four CTA labels are visible and readable, none hidden by a zero-opacity animation state
