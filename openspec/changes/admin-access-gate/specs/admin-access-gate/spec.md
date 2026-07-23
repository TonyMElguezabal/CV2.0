## ADDED Requirements

### Requirement: The admin area denies access to anyone who is not the authenticated owner
The system SHALL deny access to the admin area (`/admin` and everything under it) for any request that does not present valid owner credentials.

#### Scenario: No credentials presented
- **WHEN** a request to an admin path arrives with no `Authorization` credentials
- **THEN** the system responds with a 401 challenge and does not render the dashboard

#### Scenario: Invalid credentials presented
- **WHEN** a request to an admin path presents credentials that do not match the configured owner credentials
- **THEN** the system responds with a 401 challenge and does not render the dashboard

#### Scenario: Admin credentials are not configured
- **WHEN** the owner credentials are not configured in the environment
- **THEN** the admin area denies all access (fail closed), rather than becoming publicly reachable

### Requirement: The authenticated owner reaches the dashboard
The system SHALL admit a request presenting valid owner credentials to the protected admin dashboard.

#### Scenario: Valid credentials presented
- **WHEN** a request to an admin path presents credentials matching the configured owner credentials
- **THEN** the request is allowed through and the protected admin dashboard is served

### Requirement: Credential verification is timing-safe and server-side only
The system SHALL verify owner credentials with a constant-time comparison, and SHALL read the credentials only from server-side configuration, never exposing them to client-bundled code.

#### Scenario: Credential comparison does not leak via timing
- **WHEN** a presented credential is compared against the configured credential
- **THEN** the comparison runs in time independent of how many leading characters matched

#### Scenario: Credentials are not in client code
- **WHEN** client-bundled code is inspected
- **THEN** the admin credential environment variable names are not referenced, and the automated secret-scan test fails if they are

### Requirement: The gate does not affect the public site
The system SHALL apply the admin gate only to admin paths, leaving the public site's rendering, headers, and cookieless behavior unchanged.

#### Scenario: Public routes are unaffected
- **WHEN** a visitor requests any public (non-admin) route
- **THEN** the admin gate does not run, no authentication is required, and no authentication cookie is set

### Requirement: The admin area is excluded from search indexing
The system SHALL prevent search engines from indexing the admin area.

#### Scenario: Robots policy excludes admin
- **WHEN** the robots policy is retrieved
- **THEN** it disallows crawling of the admin path, and the admin page declares itself non-indexable

### Requirement: Repeated admin access attempts are rate limited
The system SHALL rate limit admin access attempts to protect the credential gate from brute-force guessing, reusing the application's existing rate-limit mechanism.

#### Scenario: A source exceeds the attempt limit
- **WHEN** requests to the admin area from a single source exceed the configured limit
- **THEN** further attempts are rejected with a rate-limit response until the window resets

#### Scenario: The rate-limit backend is unavailable
- **WHEN** the rate-limit backend errors
- **THEN** the request is allowed to proceed to the credential check (fail-open), consistent with the rest of the application
