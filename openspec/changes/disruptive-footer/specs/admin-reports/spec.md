## MODIFIED Requirements

### Requirement: The dashboard reports conversions
The system SHALL report action/conversion events — résumé downloads and contact clicks — as aggregate counts.

#### Scenario: Conversion counts
- **WHEN** the owner views the conversions report and the store contains résumé-download and contact-click events
- **THEN** the dashboard shows the résumé-download count and the contact-click count broken down by contact target (scheduling, email, LinkedIn, GitHub, WhatsApp)

#### Scenario: Every contact target has a human label
- **WHEN** the conversions report renders a contact-click count for any target in the analytics schema's contact-target set
- **THEN** that row shows a human-readable label (for example "GitHub", "WhatsApp"), never the raw target key
