## Purpose

Defines how the chatbot's retrieval index (chunked and embedded `/content`) is kept current: regenerated automatically as part of `npm run build`, carrying the metadata later needed for citation deep-links, and failing the build loudly rather than silently shipping a stale or missing index.

## Requirements

### Requirement: Index regenerates automatically on build
The system SHALL regenerate the retrieval index from current `/content` every time `npm run build` runs, without a separate manual step.

#### Scenario: Content changed since the last build
- **WHEN** `npm run build` runs after a `/content` file has changed
- **THEN** `lib/rag/index.json` is regenerated from the current content before `next build` produces its output

#### Scenario: No content changed since the last build
- **WHEN** `npm run build` runs with no `/content` changes since the previous run
- **THEN** the index is still regenerated (no change-detection skip), producing the same chunks and metadata

### Requirement: Indexed chunks carry citation metadata
Every chunk in the generated index SHALL carry the metadata needed for later citation deep-linking.

#### Scenario: A chunk is indexed
- **WHEN** the embedding index is built from content chunks
- **THEN** each indexed entry retains its source chunk's `source`, `chapterId` (when applicable), and `anchor` fields alongside its embedding vector

### Requirement: Build fails loudly without a required API key
The system SHALL fail the build with a clear, actionable error when `OPENAI_API_KEY` is not available, rather than proceeding with a stale or missing index.

#### Scenario: API key is missing
- **WHEN** the index-build step runs without `OPENAI_API_KEY` set in the environment
- **THEN** the build exits non-zero with a message identifying the missing key, before `next build` runs

#### Scenario: API key is available via local .env.local
- **WHEN** a developer runs `npm run build` locally with `OPENAI_API_KEY` set in `.env.local`
- **THEN** the key is loaded automatically and the index-build step succeeds without any manual export step

#### Scenario: API key is available via platform environment (no .env.local present)
- **WHEN** the build runs in an environment where `.env.local` does not exist but `OPENAI_API_KEY` is set directly in the process environment (e.g. Vercel's build environment)
- **THEN** the index-build step succeeds using that environment variable, without erroring on the missing file

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
