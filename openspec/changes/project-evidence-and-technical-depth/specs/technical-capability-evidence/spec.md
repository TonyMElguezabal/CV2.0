## ADDED Requirements

### Requirement: A claimed technology is substantiated by a backing chapter
A skill that names the technologies it rests on SHALL only name technologies that appear in the technology list of at least one of the chapters it cites as evidence. Referencing a chapter that exists SHALL NOT be sufficient to claim a technology that chapter never names.

This exists because the site's existing evidence check proves a reference *resolves*, not that it *carries* the claim — so a capability can currently be asserted against a chapter that says nothing about it, and pass the build.

#### Scenario: A skill claims a technology its evidence chapters name
- **WHEN** a skill names a technology and at least one of its evidence chapters lists that technology
- **THEN** the claim is accepted

#### Scenario: A skill claims a technology no evidence chapter names
- **WHEN** a skill names a technology that appears in none of its evidence chapters' technology lists
- **THEN** the content gate fails, identifying the skill and the unsubstantiated technology

#### Scenario: A skill that names no technologies is unaffected
- **WHEN** a skill carries evidence references but names no technologies
- **THEN** it is validated exactly as before, with no new requirement placed on it

### Requirement: Capability claims follow the evidence that supports them
A capability SHALL NOT be published to the skills surface before the content that substantiates it exists. When new capability is identified, the backing chapter SHALL be extended to describe the work first, and the skill claiming it added afterwards.

This mirrors the ordering already required between headline figures and their source metrics: a summary may only state something the detailed record already states.

#### Scenario: New capability is identified during content work
- **WHEN** capability is identified that no existing chapter currently describes
- **THEN** the chapter describing that work is authored before any skill entry claiming it is added

#### Scenario: The evidence does not support the intended claim
- **WHEN** an intended capability claim is not supported by what the backing chapters can honestly describe
- **THEN** the claim is narrowed to what the evidence supports, or omitted, rather than published against a chapter that does not carry it

### Requirement: The capability surface stays weighted toward current work
As historical content grows, the skills surface SHALL continue to represent current capability, so that added historical depth reads as range rather than as datedness. Technologies that appear only in the site's pre-résumé origins record SHALL NOT appear on the skills surface.

The balance itself is an editorial judgment made at review rather than a ratio, and is checked by reading the capability surface cold and asking whether it describes someone working now.

#### Scenario: Historical content is added
- **WHEN** content covering an earlier era is added to the site
- **THEN** the capability surface is reviewed for whether it still represents current work, rather than being left unchanged by default

#### Scenario: An origins-only technology is proposed as a skill
- **WHEN** a technology that appears only in the origins record is proposed for the skills surface
- **THEN** it is rejected, and the underlying point is expressed as narrative in its own era instead

### Requirement: Naming a client is a recorded decision
Publishing a client, employer, or account name not already present in the content SHALL be an explicit decision recorded with the change, including names that were considered and declined, so that a later author does not re-open a question already settled.

#### Scenario: A new client name is proposed
- **WHEN** content is authored that would name a client not already named on the site
- **THEN** that name is cleared explicitly before publication, and the decision is recorded

#### Scenario: A client name is declined
- **WHEN** a proposed client name is not cleared for publication
- **THEN** the refusal is recorded alongside the cleared names, and the content describes the engagement without naming the client
