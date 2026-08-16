## MODIFIED Requirements

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
