# JOS-87 Manual Endpoint Verification: POST /api/chat

**Date:** 2026-07-22
**Server:** `npm run dev` (real dev server, real `OPENAI_API_KEY` from `.env.local`)

This repo's first real HTTP endpoint — the "Manual Endpoint Testing with curl (MANDATORY)" step from `docs/openspec-tasks-mandatory-steps.md` genuinely applies here (previous stories correctly noted it didn't, since no endpoint existed yet).

## Success path: real streaming + citations

```bash
curl -sN -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What was the outcome of the ADEHub project at Oracle?"}' \
  --max-time 30
```

Observed: **~90 separate `token` SSE events**, each carrying a small piece of the answer (confirming real token-by-token streaming, not a single buffered response), followed by exactly one `citations` event and then `done`:

```
event: token
data: "The"

event: token
data: " outcome"

...

event: citations
data: [{"source":"project","anchor":"#adehub"},{"source":"experience","chapterId":"oracle","anchor":"#oracle"},{"source":"experience","chapterId":"oracle","anchor":"#oracle-projects"}]

event: done
data: {}
```

The assembled answer correctly stated the ADEHub project reached **General Availability** (matches JOS-86's `expectedSubstring` for this same question), and the citations are real anchors present in `content/experience/oracle.yaml`/`content/projects/adehub.md` — not placeholders.

## Error paths

```bash
$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"question":"   "}'
{"error":"Invalid request"}
HTTP_STATUS:400

$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{}'
{"error":"Invalid request"}
HTTP_STATUS:400

$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d 'not json'
{"error":"Invalid JSON body"}
HTTP_STATUS:400
```

All three confirmed at real HTTP 400, before any embedding or generation call.

## Conclusion

The endpoint streams token-by-token, delivers real citation anchors after the answer completes, and rejects malformed/empty requests correctly — all verified against the real dev server and real provider, not mocked. Dev server stopped after verification.
