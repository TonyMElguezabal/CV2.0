## MODIFIED Requirements

### Requirement: Hero renders a primary scroll CTA and three secondary CTAs
The hero SHALL render one primary call-to-action that invites scrolling, and three secondary calls to action: Ask AI, Download résumé, and Contact. The primary CTA SHALL scroll the visitor to the page's first real content section (`#career`) rather than to a placeholder element with no content of its own.

#### Scenario: CTA row renders
- **WHEN** the hero is rendered
- **THEN** a primary CTA inviting scrolling is present, and three secondary CTAs labeled Ask AI, Download résumé, and Contact are present

#### Scenario: Primary CTA activated
- **WHEN** a visitor activates the primary "Scroll to explore" CTA
- **THEN** the page scrolls to the `#career` section, landing on real content rather than an empty placeholder
