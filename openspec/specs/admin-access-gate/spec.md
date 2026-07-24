## Purpose

Owner-only access control for the admin area. Gates `/admin` behind a
cookie-session login so the site owner can reach the insights dashboard
while every other request is denied, with no users table and no cookie on
the public site.

## Requirements

### Requirement: The admin area denies access to anyone who is not the authenticated owner
The system SHALL deny access to the protected admin dashboard for any request that does not carry a valid session, redirecting to the login form instead of rendering the dashboard.

#### Scenario: No session presented
- **WHEN** a request to a protected admin path arrives with no admin session cookie
- **THEN** the system redirects to the admin login form and does not render the dashboard

#### Scenario: Invalid or expired session presented
- **WHEN** a request to a protected admin path carries a session cookie that fails signature verification or has expired
- **THEN** the system redirects to the admin login form and does not render the dashboard

#### Scenario: Admin credentials are not configured
- **WHEN** the owner credentials are not configured in the environment
- **THEN** the login form denies all submissions (fail closed) and no session can ever be issued, rather than the admin area becoming publicly reachable

### Requirement: The authenticated owner reaches the dashboard
The system SHALL admit a visitor to the protected admin dashboard after they submit valid owner credentials to the login form.

#### Scenario: Valid credentials submitted
- **WHEN** the login form is submitted with credentials matching the configured owner credentials
- **THEN** a signed session cookie is issued and the visitor is redirected to the protected admin dashboard

#### Scenario: A valid session persists across requests
- **WHEN** a subsequent request to a protected admin path carries a previously-issued, unexpired, validly-signed session cookie
- **THEN** the request is allowed through and the protected admin dashboard is served without requiring the login form again

### Requirement: Credential verification is timing-safe and server-side only
The system SHALL verify owner credentials submitted to the login form with a constant-time comparison, and SHALL read the credentials and the session-signing secret only from server-side configuration, never exposing them to client-bundled code.

#### Scenario: Credential comparison does not leak via timing
- **WHEN** a submitted username or password is compared against the configured credential
- **THEN** the comparison runs in time independent of how many leading characters matched

#### Scenario: Credentials are not in client code
- **WHEN** client-bundled code is inspected
- **THEN** the admin credential and session-secret environment variable names are not referenced, and the automated secret-scan test fails if they are

### Requirement: The gate does not affect the public site
The system SHALL apply the admin session cookie and login flow only to admin paths, leaving the public site's rendering, headers, and cookieless behavior unchanged.

#### Scenario: Public routes are unaffected
- **WHEN** a visitor requests any public (non-admin) route
- **THEN** no admin authentication check runs, and no admin session cookie is set or read

#### Scenario: The session cookie is scoped to the admin area
- **WHEN** the admin session cookie is issued
- **THEN** it is scoped to the admin path, marked `HttpOnly` and `Secure`, and is never sent by the browser on requests to public routes

### Requirement: The admin area is excluded from search indexing
The system SHALL prevent search engines from indexing the admin area, including the login form.

#### Scenario: Robots policy excludes admin
- **WHEN** the robots policy is retrieved
- **THEN** it disallows crawling of the admin path (including the login form), and both the dashboard and the login page declare themselves non-indexable

### Requirement: Repeated login attempts are rate limited
The system SHALL rate limit submissions to the admin login form to protect the credential gate from brute-force guessing, reusing the application's existing rate-limit mechanism.

#### Scenario: A source exceeds the attempt limit
- **WHEN** login-form submissions from a single source exceed the configured limit
- **THEN** further submissions are rejected with a rate-limit response until the window resets

#### Scenario: The rate-limit backend is unavailable
- **WHEN** the rate-limit backend errors
- **THEN** the login submission is allowed to proceed to the credential check (fail-open), consistent with the rest of the application

### Requirement: Admin sessions are signed and time-limited
The system SHALL issue session cookies that are cryptographically signed and expire after a bounded duration, and SHALL treat any cookie that fails verification as unauthenticated.

#### Scenario: Session token is tampered with
- **WHEN** a session cookie's value is modified from what the server issued
- **THEN** signature verification fails and the request is treated as having no session

#### Scenario: Session token has expired
- **WHEN** a session cookie's embedded expiry has passed
- **THEN** the session is treated as invalid regardless of signature validity

### Requirement: The admin area does not render public marketing chrome
The system SHALL render the admin area (dashboard and login form) independently of the public site's layout, with no public-facing marketing elements (the hero sequence, the chat widget, the site footer) present.

#### Scenario: The admin dashboard is inspected
- **WHEN** the admin dashboard or login form is rendered
- **THEN** it contains no hero section, no chat widget trigger, and no site footer
