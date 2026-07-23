## ADDED Requirements

### Requirement: The motion library is lazily loaded and kept out of the critical bundle
The system SHALL NOT include the full motion library in the critical initial page bundle; its animation features SHALL be loaded lazily, and the heaviest animated interactive surface (the chat panel) SHALL be code-split so it is not part of the initial bundle.

#### Scenario: The landing page's initial bundle is inspected
- **WHEN** the landing page's initial JavaScript bundle is inspected
- **THEN** the motion library's full feature set is not eagerly included, and the chat panel is a separately loaded chunk rather than part of the initial bundle

#### Scenario: The chat entry point stays available
- **WHEN** the page loads with the chat panel code-split
- **THEN** the persistent chat trigger is still present, and opening it loads and shows the panel with unchanged behavior

### Requirement: The initial JavaScript budget is enforced
The system SHALL keep the landing route's First Load JavaScript within a recorded budget, and a change exceeding the budget ceiling SHALL be treated as a regression.

#### Scenario: The build reports First Load JS
- **WHEN** a production build is produced
- **THEN** the landing route's First Load JS is at or below the recorded budget ceiling documented for the project

### Requirement: The landing page meets the Lighthouse score targets
The system SHALL achieve Lighthouse scores of at least 90 for performance, SEO, and best-practices on the landing page.

#### Scenario: The landing page is audited with Lighthouse
- **WHEN** the landing page is audited with Lighthouse against a production build
- **THEN** the performance, SEO, and best-practices scores are each at least 90 (the SEO sub-score assumes the SEO metadata capability is present)

### Requirement: The landing page meets the Largest Contentful Paint targets
The system SHALL keep Largest Contentful Paint within budget: under 2.5s on desktop broadband and under 4s on mid-range mobile.

#### Scenario: LCP is measured
- **WHEN** LCP is measured on the landing page against a production build
- **THEN** it is under 2.5s on desktop broadband and under 4s on mid-range mobile, or the measurement report documents why a representative run was not achievable in the execution environment

### Requirement: Animations sustain 60fps
The system SHALL run its animations at 60fps by animating only compositor-friendly properties (transform/opacity), with no layout-triggering animation.

#### Scenario: An animation is profiled
- **WHEN** any animated surface (hero sequence, chat panel open/close) is profiled during playback
- **THEN** it sustains 60fps and animates only transform/opacity, or the measurement report documents why a full profiling run was not achievable in the execution environment
