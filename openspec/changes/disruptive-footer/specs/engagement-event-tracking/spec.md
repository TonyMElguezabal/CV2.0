## MODIFIED Requirements

### Requirement: Résumé download and contact clicks record conversion events
The system SHALL record a `resume_download` event when the résumé link is activated and a `contact_click` event (carrying which channel) when a contact link is activated, whether that link is in the contact section or in the site footer.

#### Scenario: The résumé link is activated
- **WHEN** a visitor activates the résumé download link
- **THEN** a `resume_download` event is recorded

#### Scenario: A contact link is activated
- **WHEN** a visitor activates a contact link
- **THEN** a `contact_click` event is recorded, carrying `contactTarget` as the channel used (`scheduling`, `email`, `linkedin`, `github`, or `whatsapp`)

#### Scenario: A footer-only channel is accepted
- **WHEN** a `contact_click` event with `contactTarget` `github` or `whatsapp` is posted to the events endpoint
- **THEN** it passes payload validation and is persisted, rather than rejected as an unknown target
