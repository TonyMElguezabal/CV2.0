## ADDED Requirements

### Requirement: The deployed Worker bundle stays within the platform's size limit
The system SHALL keep the built Cloudflare Worker bundle within the gzipped upload size limit of the deployment plan in use. Exceeding that limit SHALL be treated as a release blocker rather than an advisory performance note, because the platform rejects an oversized Worker outright — the deploy fails and the live site does not update. The project SHALL record both the current measured size and the applicable limit, and SHALL re-measure whenever content that is bundled into the Worker at build time grows.

#### Scenario: The Worker bundle is measured before release
- **WHEN** a production Worker bundle is built and its gzipped upload size is measured
- **THEN** the measured size is at or below the limit of the deployment plan in use, and the measured value is recorded for the project

#### Scenario: An oversized bundle blocks the release
- **WHEN** the measured gzipped Worker size exceeds the applicable plan limit
- **THEN** the change is treated as release-blocking and is not deployed, rather than being recorded as a performance regression to address later

#### Scenario: Growth in Worker-bundled content triggers re-measurement
- **WHEN** content that is bundled into the Worker at build time grows — for example the retrieval index gaining chunks as career or FAQ content is added
- **THEN** the Worker's gzipped size is re-measured against the limit, because such content is a primary driver of the total

## REMOVED Requirements

### Requirement: The landing page meets the Lighthouse score targets

**Reason**: The site is distributed by direct URL to recruiters and via a printed résumé, not through search discovery, so Lighthouse's performance and SEO scoring measures outcomes this site does not pursue. Retaining a requirement that every change is expected to skip would leave the capability asserting a gate nobody enforces.

**Migration**: No code or configuration changes. Lighthouse may still be run for information — `site-typography-and-palette` does exactly that — but its scores no longer gate any change. The `seo-metadata-and-structured-data` capability is unaffected and remains valuable: its OpenGraph output drives the link preview a recruiter sees when the URL is pasted, which is now the site's primary first impression.

### Requirement: The landing page meets the Largest Contentful Paint targets

**Reason**: Same distribution rationale. LCP budgets exist to protect discovery-driven traffic on constrained connections; this site's visitors arrive from a deliberately shared link and current client hardware absorbs the page weight.

**Migration**: No code changes. LCP may still be recorded for information. The adjacent quality concern that does survive is visible reflow during font swap — that is captured as a requirement in the `site-visual-language` capability, framed as a first-impression obligation rather than a metric.

### Requirement: The initial JavaScript budget is enforced

**Reason**: A First Load JS ceiling constrains client delivery, which is the dimension being deprioritized. It is also the wrong instrument for the constraint that actually binds this project: client JavaScript ships as Workers Static Assets, which are served separately and do **not** count toward the Cloudflare Worker size limit that genuinely blocks releases. The added Worker-size requirement above replaces it with a limit that has real consequences.

**Migration**: No code changes. The README's recorded First Load JS figures become historical reference rather than a ceiling. Changes are no longer obliged to measure client bundle deltas.

### Requirement: The motion library is lazily loaded and kept out of the critical bundle

**Reason**: This is a client-delivery optimization whose justification was the First Load JS ceiling removed above. It does not affect the Worker size limit, since client chunks ship as static assets. With its rationale gone, keeping it would make it a decorative requirement — true, but enforced by nobody and protecting nothing.

**Migration**: **The existing implementation is deliberately not reverted.** `MotionProvider`'s `LazyMotion` boundary and the dynamically-imported `ChatPanel` remain exactly as shipped; they are simply no longer spec-mandated. A future change may make either eager without violating any requirement, though there is no reason to.
