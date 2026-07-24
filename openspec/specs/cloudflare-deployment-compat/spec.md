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
The system SHALL NOT read bundled application data files via `node:fs` at request time, in any code path that executes inside the deployed Worker (page, layout, or Route Handler) — including error-response paths, not only success paths. Data generated at build time SHALL be made available via build-time-resolved imports instead.

#### Scenario: The RAG index is loaded
- **WHEN** the retrieval index is loaded to serve a chat request
- **THEN** it is obtained via a build-time-resolved import, not a runtime `readFileSync` call

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
The system SHALL serve the OpenGraph image from the prerendered build-time cache (per the static-assets incremental cache requirement above), so `next/og`'s default system-font lookup — which depends on filesystem access — executes only during `next build`'s own Node.js prerendering, never at Worker request time.

#### Scenario: The OpenGraph image is requested under the Cloudflare build
- **WHEN** `/opengraph-image` is requested against a Cloudflare Workers build whose cache has been populated
- **THEN** the image is served from cached build-time output and renders correctly, with no request-time filesystem read attempted
