## Purpose

Defines the production behavior contract for the hero's signature animated sequence: default motion mode, the `prefers-reduced-motion` fade-only alternative, no-JS readability regardless of motion mode, and the PRD §9 60fps performance requirement.

## Requirements

### Requirement: Signature animated sequence plays under default motion settings
The hero SHALL play one signature animated sequence (scroll-driven wrapper opacity/position fade plus a staggered name/positioning entrance) when the visitor has no `prefers-reduced-motion` preference set.

#### Scenario: Default motion settings
- **WHEN** the hero is viewed with no `prefers-reduced-motion` preference (or a preference of `no-preference`)
- **THEN** the wrapper's scroll-linked opacity/position transform is active and the name/positioning text animate in with both an opacity fade and a y-offset slide

### Requirement: Fade-only alternative under prefers-reduced-motion
The hero SHALL replace the signature sequence with a fade-only alternative, and play no other motion, when the visitor has `prefers-reduced-motion: reduce` set.

#### Scenario: Reduced motion preferred
- **WHEN** the hero is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the wrapper's scroll-linked opacity/position transform does not apply (fixed, non-scroll-driven state) and the name/positioning text animate in with an opacity fade only, with no y-offset slide

### Requirement: Hero content remains readable without JavaScript regardless of motion preference
The hero's animated elements SHALL render fully readable, final-state content when JavaScript is disabled, independent of the visitor's `prefers-reduced-motion` setting.

#### Scenario: JavaScript disabled
- **WHEN** a visitor loads the hero with JavaScript disabled
- **THEN** the name and positioning text are fully visible (opacity 1, no transform offset), whether or not `prefers-reduced-motion` is set

### Requirement: Signature sequence sustains 60fps
The default (non-reduced-motion) signature animated sequence SHALL sustain 60fps during playback, per PRD §9's performance budget.

#### Scenario: Frame rate measured during playback
- **WHEN** the signature sequence's frame rate is measured via browser performance profiling while it plays
- **THEN** the recorded frame rate sustains 60fps, or the measurement report documents why a full profiling run was not achievable in the execution environment
