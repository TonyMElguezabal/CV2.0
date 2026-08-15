## MODIFIED Requirements

### Requirement: OpenGraph image generation is served from the build-time cache
The system SHALL serve the OpenGraph image without executing image generation at Worker request time, so that `next/og`'s default system-font lookup — which depends on filesystem access the Workers runtime does not provide — never runs in the Worker. The image SHALL be produced ahead of request time (at or before build) and served as prebuilt output, and the image-generation library SHALL NOT be present in the Worker's server bundle, since a library that can never legally execute there is pure bundle weight against the platform's hard size limit.

#### Scenario: The OpenGraph image is requested under the Cloudflare build
- **WHEN** the site's OpenGraph image URL is requested against a Cloudflare Workers build
- **THEN** a valid image is returned from prebuilt output, and no request-time filesystem read or image generation is attempted

#### Scenario: The image-generation library is absent from the Worker bundle
- **WHEN** the built Worker's server bundle is inspected
- **THEN** it contains no image-generation library, because image production happens ahead of request time and never in the Worker

#### Scenario: Metadata points at the served image
- **WHEN** the site's page metadata is generated
- **THEN** its OpenGraph image URL resolves to the prebuilt image that is actually served, so a shared link renders its preview card correctly
