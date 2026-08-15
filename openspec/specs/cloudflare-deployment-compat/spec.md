## Purpose

Defines the constraints the codebase must satisfy to remain deployable to
Cloudflare Workers via the OpenNext adapter (`@opennextjs/cloudflare`): no
request-time `node:fs` reads of bundled application data in genuinely
dynamic routes, no Node.js-runtime Proxy/middleware, and prerendered
routes served from a populated build-time cache rather than re-executed
per request. Exists so future changes don't silently reintroduce
incompatibilities that were only found by hands-on verification against
the real adapter, not from documentation alone.

## Requirements

### Requirement: The application builds and runs on Cloudflare Workers via the OpenNext adapter
The system SHALL produce a working Cloudflare Workers bundle via `@opennextjs/cloudflare`, and that bundle SHALL serve the landing page, the chat API (including its rate-limited and service-unavailable error responses), the OpenGraph image, the admin area (unauthenticated redirect, login, and authenticated dashboard), and the analytics endpoint without runtime errors.

#### Scenario: A production-equivalent build is run locally
- **WHEN** `@opennextjs/cloudflare`'s build is run against the repository and served with its incremental cache populated (`opennextjs-cloudflare preview`, or `build` + `populateCache local` + `wrangler dev`)
- **THEN** the build completes without error and the landing page, `/api/chat` (including its error responses), `/opengraph-image`, `/admin` (including the login flow), and `/api/events` each respond successfully

### Requirement: Static routes are served from a populated build-time cache, not re-rendered per request
The system SHALL configure the adapter's static-assets incremental cache so that prerendered, content-only routes are served directly from build-time output rather than re-executing their render function on every request.

#### Scenario: The landing page is requested
- **WHEN** the landing page is requested against a build whose cache has been populated
- **THEN** it is served from the cached build-time output, not a live re-render

#### Scenario: The cache is not yet populated
- **WHEN** the adapter's incremental cache has not been populated (e.g. a raw `wrangler dev` invocation against a fresh build)
- **THEN** this is understood to be an invalid verification state, not a representative test of production behavior — verification SHALL always populate the cache first

### Requirement: No request-time filesystem reads of bundled application data
The system SHALL NOT read bundled application data files via `node:fs` at request time, in any code path that executes inside the deployed Worker (page, layout, or Route Handler) — including error-response paths, not only success paths. Data generated at build time SHALL be made available via a build-time-resolved import, or — for data too large to justify bundling into the Worker's own script (subject to the platform's hard size limit) — via the Workers Static Assets binding (`env.ASSETS`), a Workers-native fetch that never touches `node:fs`. Either mechanism satisfies the underlying constraint (no request-time filesystem access); a data file's actual size, not a blanket rule, decides which one a given case uses.

#### Scenario: The RAG index is loaded
- **WHEN** the retrieval index is loaded to serve a chat request
- **THEN** it is obtained via the `env.ASSETS` static-assets binding, not a runtime `readFileSync` call — the index is generated at build time into a servable static asset (not bundled into the Worker's own script), because its size is large enough that bundling it would consume a disproportionate share of the Worker's hard size limit, and the Assets binding carries no such limit for this content

#### Scenario: Chat error responses need contact information
- **WHEN** `/api/chat` returns a rate-limited or service-unavailable error response
- **THEN** the contact information it includes is obtained via a build-time-resolved import, not a runtime content read

#### Scenario: The admin dashboard needs the ordered chapter list
- **WHEN** the admin dashboard queries analytics reports scoped by chapter
- **THEN** the ordered chapter-ID list is obtained via a build-time-resolved import, not a runtime content read

#### Scenario: The admin area's layout does not trigger runtime content reads
- **WHEN** any admin-area route (login or dashboard) is requested
- **THEN** no code path rendering it performs a request-time filesystem read of `/content`

### Requirement: No Node.js-runtime Proxy or middleware
The system SHALL NOT declare a Node.js-runtime Proxy (`proxy.ts`) or middleware, since the current Cloudflare adapter does not support it; cross-cutting concerns SHALL be implemented via Route Handlers and Server Components instead.

#### Scenario: The repository is inspected for Proxy/middleware
- **WHEN** the repository root is inspected
- **THEN** no `proxy.ts` or `middleware.ts` file declaring the Node.js runtime is present

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
