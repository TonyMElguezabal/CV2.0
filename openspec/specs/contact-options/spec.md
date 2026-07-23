## Purpose

Defines the dedicated contact section at the bottom of the page — scheduling, email, and LinkedIn affordances rendered from validated profile data, with no contact form.

## Requirements

### Requirement: Contact section offers scheduling, email, and LinkedIn
The system SHALL render a dedicated contact section offering a scheduling link, a mailto link, and a LinkedIn link, each sourced from `content/profile.yaml` (`contact.scheduling`, `contact.email`, `links.linkedin`).

#### Scenario: Contact section is rendered
- **WHEN** the contact section is rendered
- **THEN** it contains a scheduling link pointing to `contact.scheduling`, a mailto link built from `contact.email`, and a LinkedIn link pointing to `links.linkedin`

### Requirement: The scheduling link reaches the external scheduling page
The scheduling link SHALL navigate to the external scheduling provider and open it in a new browsing context without exposing the originating page.

#### Scenario: Scheduling link is activated
- **WHEN** a visitor activates the scheduling link
- **THEN** the browser navigates to the `contact.scheduling` URL in a new tab, with `rel="noopener noreferrer"` set

### Requirement: The contact section contains no contact form
The contact section SHALL NOT contain a contact form (MVP constraint, PRD §5 F7).

#### Scenario: Contact section is inspected
- **WHEN** the rendered contact section is inspected
- **THEN** it contains no `form` element
