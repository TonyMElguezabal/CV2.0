## Purpose

Defines `GET /go/whatsapp`, a server-only redirect that forwards visitors to
a `wa.me` link built from a runtime secret, so the owner's phone number is
never published in content, markup, the client bundle, or the chatbot's
retrieval index.

## Requirements

### Requirement: The WhatsApp redirect forwards to a server-held number
The system SHALL serve `GET /go/whatsapp`, which responds with a `302` redirect to `https://wa.me/<number>`. The number SHALL be read at request time from the server-side `WHATSAPP_NUMBER` secret.

#### Scenario: A configured redirect is requested
- **WHEN** `WHATSAPP_NUMBER` is set to a digits-only value and `GET /go/whatsapp` is requested
- **THEN** the response status is `302` and its `Location` header is `https://wa.me/` followed by exactly that value

### Requirement: The phone number never leaves the server except in the redirect
The phone number SHALL exist only in the `WHATSAPP_NUMBER` secret and in the redirect's `Location` header. It SHALL NOT appear in `/content`, in rendered page HTML, in the client JavaScript bundle, in the chatbot's retrieval index, in `NEXT_PUBLIC_*` variables, or in server logs.

#### Scenario: The secret is server-side only
- **WHEN** the client bundle, the rendered marketing HTML, `content/`, and `public/rag-index.json` are searched for the configured number and for `wa.me`
- **THEN** neither is found

#### Scenario: The route never logs the number
- **WHEN** the redirect route handles a request
- **THEN** it writes no log line containing the number or the redirect target

### Requirement: A missing or malformed number fails closed
If `WHATSAPP_NUMBER` is unset, empty, or contains anything other than digits (E.164 without the leading `+`, 8–15 digits), the route SHALL respond `503` and SHALL NOT emit a `wa.me` redirect.

#### Scenario: The secret is unset
- **WHEN** `WHATSAPP_NUMBER` is unset and `GET /go/whatsapp` is requested
- **THEN** the response status is `503` and it has no `Location` header

#### Scenario: The secret is malformed
- **WHEN** `WHATSAPP_NUMBER` is `+52 55 1234 5678` (it contains a `+` and spaces) and `GET /go/whatsapp` is requested
- **THEN** the response status is `503` and it has no `Location` header

### Requirement: The redirect is rate limited per client
The route SHALL rate limit requests per client IP under a key namespace of its own, so its counter is independent of the chat and events limiters. Requests above the limit SHALL receive `429`. The limiter fails open: an outage of the rate-limit store SHALL NOT block the redirect.

#### Scenario: A client exceeds the limit
- **WHEN** one client IP exceeds the configured request limit within the window
- **THEN** further requests in that window receive `429` with no `Location` header

#### Scenario: The rate-limit store is unavailable
- **WHEN** the rate-limit store throws
- **THEN** the request is treated as allowed and redirects normally

### Requirement: The redirect is neither indexed nor cached
The redirect response SHALL carry `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`, so neither search engines nor the CDN retain the target.

#### Scenario: Response headers are inspected
- **WHEN** a successful `GET /go/whatsapp` response is inspected
- **THEN** it carries `X-Robots-Tag` containing `noindex` and `Cache-Control` containing `no-store`
