# Step 11 Report — Manual Endpoint Testing with curl

- Date: 2026-10-06
- Change: disruptive-footer (JOS-191)
- Agent: Claude (opsx:apply)

## Setup and safety

- `.env.local` holds a **live** `DATABASE_URL` and **live** Upstash credentials. It was **not modified**.
- The test number was passed on the command line (`WHATSAPP_NUMBER=... npx next dev`), never written to disk.
- Dev servers were run one at a time (Next's dev lock permits one per project). All were stopped afterwards; none are running.

## Commands and responses

1. `WHATSAPP_NUMBER=15550000000 npx next dev -p 3100`, then:
   - `curl -si http://localhost:3100/go/whatsapp`
     - `HTTP/1.1 302 Found`
     - `location: https://wa.me/15550000000`
     - `cache-control: no-store`
     - `x-robots-tag: noindex, nofollow`
   - `curl -s http://localhost:3100/robots.txt`
     - includes `Disallow: /admin` and `Disallow: /go/`, and the sitemap line
2. `WHATSAPP_NUMBER="+52 55 1234 5678" npx next dev -p 3101`, then `curl -si http://localhost:3101/go/whatsapp`
   - `HTTP/1.1 503 Service Unavailable`, no `location` header (fail closed)
3. `env -u WHATSAPP_NUMBER npx next dev -p 3102`, then `curl -si http://localhost:3102/go/whatsapp`
   - `HTTP/1.1 503 Service Unavailable`, no `location` header (fail closed)

## Not run, and why

- **11.4 live rate-limit loop (429):** not run live. Each request would count against the production Upstash limiter. The 429 path (and the fail-open path) is covered by `app/go/whatsapp/route.test.ts` with an injected fake store.
- **11.6 `POST /api/events` with `contactTarget: "whatsapp"`:** not run. It would write to the live analytics database, and the live `CHECK` constraint still rejects `github` and `whatsapp` until the owner applies `lib/analytics/migrations/2026-10-disruptive-footer-contact-targets.sql`. The Zod schema is covered by unit tests.

## Outcome

- Step 11 status: **PASS for the WhatsApp route and robots (302, 503, no-store, noindex, `/go/` disallowed).**
- 11.4 and 11.6: **not executed live**, for the reasons above.
- No test data was written to any service.
