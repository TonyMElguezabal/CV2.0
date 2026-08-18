## ADDED Requirements

### Requirement: Career-chapter chunks are self-describing in time and attribution
The technologies, responsibilities, leadership, and lessons chunks generated from a career chapter SHALL identify the role, the company, and the chapter's date range within their own text, so that a chunk retrieved in isolation carries the era and the employer it belongs to. Because the chunk's text is the input to the embedding model, this metadata SHALL live in the text itself rather than only in structured fields, so that it informs both retrieval ranking and the answer generated from it.

This exists because retrieval has no notion of recency: without an in-text date, a chunk naming legacy tooling competes on equal footing with a chunk naming current tooling for a question explicitly about present-day capability. The context and mission-and-dates chunks are unaffected — they already carry this attribution.

#### Scenario: A technologies chunk names its era
- **WHEN** the content chunks are generated for a career chapter whose `technologies` list is non-empty
- **THEN** the resulting technologies chunk names the chapter's role, company, and human-readable date range alongside the technologies, so the tools are attributable to a period

#### Scenario: A responsibilities, leadership, or lessons chunk names its chapter
- **WHEN** the content chunks are generated for a career chapter
- **THEN** its responsibilities, leadership, and lessons chunks each identify the role, company, and date range they belong to, rather than presenting unattributed prose

#### Scenario: A technologies, actions, leadership, or lessons chunk retrieved in isolation is attributable
- **WHEN** a technologies, responsibilities, leadership, or lessons chunk is read without its surrounding chunks
- **THEN** the employer and the time period it describes can be determined from that chunk's text alone

#### Scenario: Date rendering is consistent across chunk types
- **WHEN** a date range is rendered into a technologies, actions, leadership, or lessons chunk
- **THEN** it uses the same human-readable form already used for the chapter's mission-and-dates chunk, so a single chapter is not described by two different date formats

## MODIFIED Requirements

### Requirement: The index covers every retrievable content facet
The generated index SHALL contain chunks covering every facet of `/content` that a visitor could reasonably ask about — the profile's positioning and summary, each career chapter's mission and date range, each career chapter's technologies, each skill's prose summary, and the site-meta source — in addition to the chapter context, responsibilities, projects, leadership, lessons, standalone projects, and FAQ pairs already covered. No validated content field intended for visitor-facing answers may exist in `/content` without a corresponding chunk in the index.

#### Scenario: Profile content is retrievable
- **WHEN** the content chunks are generated
- **THEN** at least one chunk with source `profile` is present, containing the profile's positioning statement and summary

#### Scenario: Chapter mission and dates are retrievable
- **WHEN** the content chunks are generated
- **THEN** each career chapter contributes a chunk containing its role, company, mission, and a human-readable form of its start and end dates

#### Scenario: Chapter technologies are retrievable
- **WHEN** the content chunks are generated
- **THEN** each career chapter whose `technologies` list is non-empty contributes a chunk naming those technologies together with the chapter's role and company

#### Scenario: Site-meta content is retrievable
- **WHEN** the content chunks are generated
- **THEN** at least one chunk with source `meta` is present, describing the site's architecture and its chatbot's retrieval-and-generation pipeline

#### Scenario: Skill chunks carry prose, not only references
- **WHEN** the content chunks are generated
- **THEN** each skill chunk contains that skill's `summary` prose alongside its name and evidence references

#### Scenario: No chunk is too short to embed meaningfully
- **WHEN** the content chunks are generated
- **THEN** every chunk's **authored content** — excluding any attribution or date framing the generator adds — is long enough to carry retrievable meaning rather than a bare label or identifier list

#### Scenario: Generated framing cannot mask thin authored content
- **WHEN** a chunk's authored content is shorter than the minimum retrievable length but the generator's added framing would bring the combined text above it
- **THEN** the thin content is still reported, because the minimum length is measured against authored content rather than generated framing
