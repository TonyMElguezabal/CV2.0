## Purpose

Defines the two performance constraints that actually bind this site: the
deployed Cloudflare Worker bundle SHALL stay within its deployment plan's
gzipped size limit (the platform rejects an oversized Worker outright, so
this is a release blocker, not an advisory metric), and animations SHALL
sustain 60fps via compositor-only properties (`transform`/`opacity`),
since janky motion directly damages the first impression this site exists
to create. Client-delivery and search-discovery metrics — Lighthouse
score, LCP, First Load JS, motion-library lazy-loading — are deliberately
not budgeted here: this site is distributed by direct URL and printed
résumé, not search discovery, so those proxies do not measure this site's
actual audience (owner decision, 2026-08-13).

## Requirements

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

### Requirement: Animations sustain 60fps
The system SHALL run its animations at 60fps, across both mechanisms it uses:

- **DOM property animation** SHALL animate only compositor-friendly properties (transform/opacity), with no layout-triggering animation.
- **Canvas-rendered animation** SHALL keep its per-frame work within a 60fps frame budget, and SHALL stop its animation loop whenever it is not visible — when the document is hidden, or when the animated surface is outside the viewport — rather than running continuously in the background.

The second clause exists because a canvas repaints pixels rather than animating CSS properties, so the transform/opacity constraint does not describe it: without this, canvas animation would fall outside the requirement entirely while the 60fps intent plainly applies to it.

#### Scenario: A DOM animation is profiled
- **WHEN** any DOM-animated surface (hero sequence, chat panel open/close) is profiled during playback
- **THEN** it sustains 60fps and animates only transform/opacity, or the measurement report documents why a full profiling run was not achievable in the execution environment

#### Scenario: A canvas animation is profiled
- **WHEN** any canvas-rendered animated surface is profiled during playback
- **THEN** its per-frame work stays within a 60fps frame budget, or the measurement report documents why a full profiling run was not achievable in the execution environment

#### Scenario: A canvas animation is not visible
- **WHEN** the document is hidden, or a canvas-rendered animated surface is scrolled outside the viewport
- **THEN** that surface's animation loop is stopped rather than continuing to run
