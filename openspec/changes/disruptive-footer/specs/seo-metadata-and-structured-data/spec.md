## MODIFIED Requirements

### Requirement: Crawlers receive a robots policy and a sitemap
The system SHALL serve a robots policy and a sitemap so search engines can crawl and index the site's public pages. The policy SHALL exclude the owner-only `/admin` surface and the `/go/` redirect routes.

#### Scenario: Robots endpoint is requested
- **WHEN** `/robots.txt` is requested
- **THEN** it returns a policy allowing crawling of `/`, disallowing `/admin` and `/go/`, and referencing the sitemap URL

#### Scenario: Sitemap endpoint is requested
- **WHEN** `/sitemap.xml` is requested
- **THEN** it lists the site's routes with absolute URLs derived from the configured site origin, and lists no `/go/` route
