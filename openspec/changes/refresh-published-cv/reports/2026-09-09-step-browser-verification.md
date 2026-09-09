# Browser Verification

- Date: 2026-09-09
- Change: refresh-published-cv (JOS-123)
- Agent: Claude Sonnet 5

Live verification against a local `next dev` server, driven via
Claude-in-Chrome, against the working tree at commit `988aa81` (both
`refresh-published-cv` commits applied). All commands below are against
the committed state — nothing verified here is stale relative to the
current branch tip.

## 1. Asset swap — served bytes and headers

- `curl -sI http://localhost:3000/resume.pdf`: `200 OK`,
  `Content-Type: application/pdf`, `Content-Length: 259572`
- SHA-256 of the response body and of `public/resume.pdf` on disk: **identical**
  (`9ac4f79c3d0b9a75ce94da66b35406f56da6f87166233f7d025a7f4ba3b6a052`)
- Parsed the served bytes: 2 pages, matching the converted PDF's known shape

## 2. CTA — live DOM and network

Executed in-page via `javascript_tool` against `http://localhost:3000/`:

```json
{
  "found": true,
  "text": "Download résumé",
  "href": "/resume.pdf",
  "download": "Jose Munoz Elguezabal.pdf",
  "analytics": "resume_download",
  "accessibleName": "Download résumé",
  "fetchStatus": 200,
  "contentType": "application/pdf",
  "contentLength": "259572"
}
```

Confirms `one-click-resume-download`'s existing requirements hold unchanged:
one CTA, one click, professional save-as filename, `resume_download`
analytics attribute present — none of which this change was supposed to
touch (Decision 3), and none of which did.

## 3. Positioning sync — live DOM

Executed in-page after the `content/profile.yaml`/`content/faq.md` edits:

```json
{
  "title": "Jose Muñoz — Director of Delivery & Engineering specializing in complex software programs,",
  "h1": "Jose Muñoz",
  "hasDirector": true,
  "hasOldTitle": false,
  "terminalLine": "jose_munoz — director of delivery & engineering",
  "positioningEl": "Director of Delivery & Engineering specializing in complex software programs, engineering organizations, cloud initiatives, AI-enabled products, and cross-functional delivery."
}
```

- Page `<title>`, hero positioning text, and the terminal easter-egg line all
  read the new title.
- `hasOldTitle` (regex for "Technical Delivery Manager" across
  `document.body.innerText`): **false** — no occurrence of the superseded
  title anywhere in the rendered page.

This is the direct verification of this change's new spec requirement
(`specs/one-click-resume-download/spec.md`'s "The published résumé's stated
title matches site positioning") against the actual rendered output, not
just the source files.

## 4. Console

`read_console_messages` with `onlyErrors: true` and a broad
`error|warn|hydrat|failed` pattern: **no console errors or exceptions**.
A dev-only `eval()` CSP notice and Upstash Redis "missing env var" warnings
were present in the server log — both pre-existing, unrelated to this
change (Redis is the local rate-limiter backing `/api/events`, expected to
be unconfigured in local dev; `/api/events` itself returned `204`).

## 5. Screenshot

Captured a full-page screenshot of the rendered CV PDF (both pages,
via Quick Look thumbnail rather than in-browser, since Chrome's native PDF
viewer is not screenshot-able through this tooling) confirming: correct
2-page layout, embedded fonts render correctly (Oswald/Source Sans, neither
installed on the host machine, proving embedding rather than substitution),
no truncated or overflowing content on either page.

## Outcome

- Status: **PASS**
- Blocking issues: none
- Not verified here (carried as open items in design.md, not silently
  closed): résumé behavior on a real mobile device, and cache invalidation
  behavior on the actual deployed Cloudflare Worker (only local/dev-server
  byte-identity was checked, per Decision 3's risk note).
