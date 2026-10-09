## MODIFIED Requirements

### Requirement: The palette is a bounded set of tints, each meeting AA at its permitted use
The site SHALL define a bounded set of foreground tints rather than drawing freely from an open colour scale. Every tint permitted to carry text SHALL meet WCAG 2.1 AA against every background it actually renders on — at least 4.5:1 for normal-size text. Those backgrounds are the page background and the raised surface (`--surface-raised`) used by the site footer. Any tint that does not meet that threshold SHALL be designated for non-text use only (borders, rules, dividers) and SHALL NOT be applied to text. The raised surface is itself a palette token, not an arbitrary colour.

#### Scenario: Every text tint clears the normal-text threshold
- **WHEN** each tint permitted for text is measured against the page background it renders on
- **THEN** each achieves at least 4.5:1

#### Scenario: Every text tint clears the threshold on the raised surface
- **WHEN** each tint permitted for text is measured against `--surface-raised`
- **THEN** each achieves at least 4.5:1, and the border tint (`--hair`) still achieves at least 3:1 for non-text use

#### Scenario: The hairline tint never carries text
- **WHEN** the tint reserved for borders and rules is located in the stylesheets
- **THEN** it is applied only to border, rule, or divider properties, and never to a text colour

#### Scenario: The palette is bounded
- **WHEN** the site's foreground colours and surfaces are inventoried
- **THEN** they resolve to the defined token set rather than to arbitrary steps of an open colour scale
