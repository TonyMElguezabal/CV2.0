## ADDED Requirements

### Requirement: The footer is a contact surface with one primary action
The system SHALL render, at the bottom of every marketing page, a `<footer>` landmark containing, in order:
- a decorative Mar.IA illustration
- a headline rendered as an `h2`
- a subline
- one primary call-to-action
- a row of contact icon links
- the analytics disclosure

#### Scenario: The footer is rendered
- **WHEN** the marketing layout is rendered
- **THEN** it contains exactly one `<footer>` element with the illustration, an `h2` headline, the subline, the call-to-action, the icon row, and the analytics disclosure, in that order

#### Scenario: The footer is absent from the admin surface
- **WHEN** any `/admin` page is rendered
- **THEN** it does not contain the marketing footer

### Requirement: Footer copy is sourced from validated profile content
The system SHALL source the footer's headline, subline, call-to-action label, and call-to-action sub-label from a `footer` block in `content/profile.yaml`, validated by the content schema, and SHALL NOT hardcode that copy in the component.

#### Scenario: Footer copy comes from content
- **WHEN** the footer is rendered with a profile whose `footer` block holds given strings
- **THEN** the rendered headline, subline, call-to-action label, and sub-label are exactly those strings

#### Scenario: A missing footer block fails validation
- **WHEN** `npm run validate:content` runs against a `profile.yaml` with no `footer` block, or with any of its four fields missing
- **THEN** validation fails with a non-zero exit code naming the missing field

### Requirement: The primary call-to-action opens the scheduling page
The footer's call-to-action SHALL link to `contact.scheduling` and open it in a new browsing context with `rel="noopener noreferrer"`. It SHALL be a single link showing both its label and its sub-label, and it SHALL show a pressed state when activated.

#### Scenario: The call-to-action is inspected
- **WHEN** the rendered call-to-action is inspected
- **THEN** it is one `<a>` whose `href` is `contact.scheduling`, with `target="_blank"` and `rel` containing `noopener` and `noreferrer`, and its text contains both the label and the sub-label

#### Scenario: The call-to-action is recorded
- **WHEN** a visitor activates the call-to-action
- **THEN** a `contact_click` event with `contactTarget` `scheduling` is recorded

### Requirement: The footer offers every contact channel as a named icon link
The footer SHALL render an icon link for each of these channels:
- LinkedIn (`links.linkedin`)
- GitHub (`links.github`)
- WhatsApp (`/go/whatsapp`)
- scheduling (`contact.scheduling`)
- email (`mailto:` + `contact.email`)

Each icon SHALL be an inline SVG marked `aria-hidden`, and each link SHALL carry an accessible name naming its destination. Each link SHALL record a `contact_click` event with its channel as `contactTarget`. External links SHALL open in a new browsing context with `rel="noopener noreferrer"`.

#### Scenario: Each icon link has an accessible name
- **WHEN** the footer's icon links are inspected
- **THEN** each has a non-empty accessible name identifying its destination (for example "LinkedIn", "WhatsApp"), and its SVG is `aria-hidden="true"`

#### Scenario: Each icon link carries its analytics target
- **WHEN** the footer's icon links are inspected
- **THEN** each carries `data-analytics-event="contact_click"`, with `data-analytics-target` set to `linkedin`, `github`, `whatsapp`, `scheduling`, or `email` respectively

#### Scenario: The WhatsApp link never exposes a phone number
- **WHEN** the rendered footer HTML is inspected
- **THEN** the WhatsApp link's `href` is `/go/whatsapp`, it carries `rel` containing `nofollow`, and no `wa.me` URL or phone number appears anywhere in the markup

#### Scenario: A missing GitHub link omits its icon
- **WHEN** the profile has no `links.github`
- **THEN** the footer renders no GitHub icon link and renders no link with an empty `href`

### Requirement: The footer keeps the analytics disclosure
The footer SHALL keep the cookieless-analytics disclosure required by `cookieless-analytics-baseline`, with its text unchanged.

#### Scenario: The disclosure survives the redesign
- **WHEN** the footer is rendered
- **THEN** it contains text stating that anonymous, cookieless usage analytics are collected, that no personal data and no cookies are used, and that events are retained for 180 days

### Requirement: The footer renders fully without JavaScript
The footer's text, call-to-action, icon links, and illustration SHALL be present and visible in the server-rendered HTML, so the footer works without JavaScript.

#### Scenario: The footer is rendered server-side
- **WHEN** the footer is rendered with `renderToStaticMarkup`
- **THEN** the headline, subline, call-to-action, all icon links, the illustration images, and the disclosure are present in the markup, and none is rendered only after a client effect

### Requirement: The illustration is decorative, static-asset, and layered
The footer illustration SHALL be hidden from assistive technology. It SHALL be served as static image files from `/public`, never as inline data URIs. It SHALL be composed of three stacked layers: body, upper arm, and forearm with the pointing hand. Each image SHALL declare explicit width and height and load lazily.

#### Scenario: The illustration is hidden from assistive technology
- **WHEN** the illustration's container is inspected
- **THEN** it is `aria-hidden="true"`, and each of its images has an empty `alt`

#### Scenario: The illustration does not inflate the bundle
- **WHEN** the illustration's image sources are inspected
- **THEN** each is a path under `/` served from `public/`, and none is a `data:` URI

#### Scenario: The illustration reserves its space
- **WHEN** each illustration image is inspected
- **THEN** it carries explicit `width` and `height` attributes and `loading="lazy"`

### Requirement: The finger wag is a transform-only loop that stops under reduced motion
The forearm layer SHALL wag by rotating around the elbow pivot, using only a `transform` rotation, while the body and upper-arm layers stay static. Under `prefers-reduced-motion: reduce`, the forearm SHALL render at rest with no looping animation.

#### Scenario: The wag animates only the forearm
- **WHEN** the illustration is rendered with motion allowed
- **THEN** only the forearm layer carries a rotate animation, with its `transform-origin` at the recorded elbow pivot, and no other layer animates

#### Scenario: Reduced motion stops the wag
- **WHEN** the illustration is rendered with `prefers-reduced-motion: reduce`
- **THEN** the forearm layer carries no looping animation and renders at its rest angle

### Requirement: The fixed chat trigger never covers the footer's actions
At every viewport width, the footer SHALL leave enough bottom clearance that the fixed chat trigger overlaps neither the call-to-action nor any icon link.

#### Scenario: Footer actions stay clear of the chat trigger
- **WHEN** the page is scrolled to the bottom at viewport widths of 360px, 768px, and 1440px
- **THEN** the bounding box of the chat trigger intersects neither the call-to-action's bounding box nor any icon link's bounding box, and the page has no horizontal scroll
