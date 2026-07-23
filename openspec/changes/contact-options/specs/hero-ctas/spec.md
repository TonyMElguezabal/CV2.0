## REMOVED Requirements

### Requirement: Contact CTA uses real profile contact data
**Reason**: The "Contact" CTA now scrolls to the dedicated `#contact` section (JOS-69) instead of opening an email client directly, so it no longer sources `contact.email`.
**Migration**: Replaced by "Contact CTA leads to the contact section" (below). The email affordance now lives in the contact section, defined by the `contact-options` capability.

### Requirement: Ask AI CTA is visibly present but non-functional
**Reason**: Stale — the chat widget shipped (JOS-62), which enabled this CTA to open the chat. The requirement described a disabled placeholder that no longer exists in the shipped UI.
**Migration**: Replaced by "Ask AI CTA opens the chat widget" (below).

## ADDED Requirements

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
