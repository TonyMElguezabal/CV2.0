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
