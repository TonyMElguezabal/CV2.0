## ADDED Requirements

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

### Requirement: Contact CTA uses real profile contact data
The "Contact" CTA SHALL link using `content/profile.yaml`'s `contact.email` field, not a hardcoded value.

#### Scenario: Contact CTA activated
- **WHEN** a visitor activates the "Contact" CTA
- **THEN** their email client opens a new message addressed to the email address defined in `content/profile.yaml`

### Requirement: Ask AI CTA is visibly present but non-functional
The "Ask AI" CTA SHALL be visibly rendered as a disabled control indicating the capability is not yet available, since the chatbot feature does not exist yet.

#### Scenario: Ask AI CTA rendered
- **WHEN** the hero is rendered
- **THEN** the "Ask AI" CTA is visible, disabled, and labeled to indicate it is not yet available

#### Scenario: Ask AI CTA activation attempt
- **WHEN** a visitor attempts to activate the disabled "Ask AI" CTA
- **THEN** no navigation or chat interface occurs

### Requirement: Hero content remains readable with JavaScript disabled
All hero content — name, positioning, and CTA labels — SHALL remain fully readable when JavaScript is disabled in the visitor's browser.

#### Scenario: JavaScript disabled
- **WHEN** a visitor loads the hero page with JavaScript disabled
- **THEN** the name, positioning statement, and all four CTA labels are visible and readable, none hidden by a zero-opacity animation state
