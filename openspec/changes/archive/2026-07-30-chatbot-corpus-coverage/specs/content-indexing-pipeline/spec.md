## ADDED Requirements

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
- **THEN** every chunk's text is long enough to carry retrievable meaning rather than a bare label or identifier list

### Requirement: Self-describing content resolves model identifiers from code
Chunks generated from the site-meta content source SHALL have the active LLM model identifier and the embedding model identifier injected from the application's model constants at index-build time, rather than read from the content file, so the corpus cannot describe a model the application no longer uses.

#### Scenario: Meta chunks name the configured models
- **WHEN** the content chunks are generated from `content/meta.md`
- **THEN** the resulting chunk text names the LLM model identifier configured in the active provider and the embedding model identifier used to build the index

#### Scenario: The configured model changes
- **WHEN** the active provider's model identifier is changed in code and the index is rebuilt
- **THEN** the meta chunks name the new identifier, with no edit to any file under `/content`
