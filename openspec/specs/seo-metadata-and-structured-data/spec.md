## Purpose

Defines the site's discoverability and share-preview surface — complete head metadata, an OpenGraph/Twitter card with a content-generated image, `Person`/`ProfilePage` JSON-LD, and robots/sitemap — all sourced from validated profile content.

## Requirements

### Requirement: Pages carry complete head metadata from profile content
The system SHALL render complete head metadata on every server-generated page — title, description, canonical URL, and `metadataBase` — sourced from `content/profile.yaml`, not hardcoded.

#### Scenario: Landing page head is inspected
- **WHEN** the landing page's `<head>` is inspected
- **THEN** it contains a title and description derived from the profile, a canonical link, and OpenGraph and Twitter card tags

#### Scenario: Metadata reflects profile content
- **WHEN** the profile's name or positioning changes in `content/profile.yaml`
- **THEN** the rendered title/description and card text change accordingly, with no separately maintained copy

### Requirement: A shared link renders an OpenGraph card with a content-generated image
The system SHALL expose OpenGraph and Twitter metadata pointing at an image that is generated from profile content, so that sharing the site URL renders a designed preview card.

#### Scenario: OpenGraph metadata is present
- **WHEN** the page metadata is inspected
- **THEN** it includes an OpenGraph type, title, description, url, and image, and a Twitter `summary_large_image` card

#### Scenario: The share image is generated from content
- **WHEN** the OpenGraph image is requested
- **THEN** an image is returned rendering the profile's name and positioning, sized for social preview (1200×630)

### Requirement: The landing page emits valid Person and ProfilePage structured data
The system SHALL emit JSON-LD structured data on the landing page describing a `Person` and a `ProfilePage` per schema.org, sourced from profile content.

#### Scenario: Structured data is present and well-formed
- **WHEN** the landing page's structured data is inspected
- **THEN** it contains a `@context` of `https://schema.org`, a `Person` with name, job title/description, and `sameAs` links, and a `ProfilePage` referencing that person

#### Scenario: Structured data validates
- **WHEN** the landing page is run through a schema.org / rich-results validator
- **THEN** the `Person` and `ProfilePage` schemas are reported as valid with no errors

### Requirement: The canonical site URL is resolved from configuration
The system SHALL derive every absolute URL (canonical, OpenGraph, sitemap, structured-data identifiers) from a single configured site origin, never from a hardcoded domain.

#### Scenario: Site URL comes from environment
- **WHEN** the site origin is resolved
- **THEN** it is taken from `NEXT_PUBLIC_SITE_URL`, falling back to the platform-provided production URL, and finally to a localhost default in development

### Requirement: Crawlers receive a robots policy and a sitemap
The system SHALL serve a robots policy and a sitemap so search engines can crawl and index the site.

#### Scenario: Robots endpoint is requested
- **WHEN** `/robots.txt` is requested
- **THEN** it returns a policy allowing crawling and referencing the sitemap URL

#### Scenario: Sitemap endpoint is requested
- **WHEN** `/sitemap.xml` is requested
- **THEN** it lists the site's routes with absolute URLs derived from the configured site origin
