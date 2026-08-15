# Step 7 Report - Preview / Manual Endpoint Verification

- Date: 2026-08-14
- Change: reduce-worker-bundle-size
- Agent: Claude Code (opsx:apply)

## Environment

- `npm run preview` (`opennextjs-cloudflare build && opennextjs-cloudflare preview`) — the real OpenNext/Wrangler build and local Workers runtime, not `next dev`. This populates the Workers Static Assets cache automatically; per the README, a raw `wrangler dev` gives false-negative crashes for static routes because that cache isn't populated.
- Served at `http://localhost:8789` (port assigned by Wrangler for this session)

## Bundle Measurements (the headline result of this change)

| Stage | Total Upload gzip | % of 3072 KiB limit | Headroom |
|---|---|---|---|
| Baseline (before this change) | 3009.68 KiB | 97.97% | ~62 KiB |
| After lever ① (RAG index → Assets binding) | 2393.92 KiB | 77.93% | 678.08 KiB |
| After lever ② (`next/og` removed) | **1520.08 KiB** | **49.48%** | **1551.92 KiB** |

**Combined: 1489.6 KiB reclaimed from baseline** — headroom against the free-tier limit essentially doubled from under 2% to over 50%. See `openspec/changes/reduce-worker-bundle-size/tasks.md` Task Groups 1-2 for the full investigation, including the mid-implementation pivot from the originally-scoped `outputFileTracingExcludes` approach (which real measurement showed didn't work) to moving the index onto the Workers Static Assets binding entirely (design.md Decisions 5-6).

## curl / Manual Endpoint Testing (task 6)

### Landing page
```
$ curl -sI http://localhost:8789/
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: s-maxage=31536000, stale-while-revalidate=2592000
```

### OpenGraph image (lever ②'s output)
```
$ curl -sI http://localhost:8789/og-image.png
HTTP/1.1 200 OK
Content-Type: image/png
CF-Cache-Status: HIT
```
Downloaded and parsed the actual bytes (not just headers): real PNG signature, `1200 x 630, 8-bit/color RGBA` — matches the declared size exactly. Visually confirmed legible and correctly composed (see task 3.2).

### RAG index static asset (lever ①'s output)
```
$ curl -sI http://localhost:8789/rag-index.json
HTTP/1.1 200 OK
Content-Type: application/json
CF-Cache-Status: HIT
```
Earlier in this session, downloaded and confirmed the byte size (3,514,452 bytes) matches the source file exactly.

### `/api/chat` — proves neither lever broke retrieval
```
$ curl -s -X POST http://localhost:8789/api/chat \
    -H "Content-Type: application/json" \
    -d '{"question":"What projects has Jose delivered with AI?"}'
```
Streamed back a correct, grounded answer citing real content: the Oracle RAG-chatbot integration (Oracle Cloud Infrastructure's AI/LLM services) and the Envato/Placeit AI-powered background-removal tool (ML image segmentation). This was tested twice in this session with different questions, both times retrieving contextually correct, real content — not a generic or empty response, which is what an over-broad exclusion or a broken Assets fetch would have produced.

## Browser/Preview Verification (task 7)

- `npm run preview` run twice during this session (once after lever ① alone, once after both levers), each time from a fully clean rebuild (`rm -rf .next .open-next`)
- Landing page, `/api/chat`, the OpenGraph image, and the RAG index asset all verified working against the real Workers runtime (Wrangler + Miniflare), not just `next dev` — per `cloudflare-deployment-compat`'s own accepted requirement that verification must populate the cache first, which `npm run preview` does automatically
- `/admin` and `/api/events` were not re-verified in this session (unaffected by either lever — `/admin` doesn't touch the RAG index or OG image, and this change doesn't touch analytics); no evidence they were disturbed, since neither lever's code paths are anywhere near them

## Outcome

- Step 7 status: **PASS**
- Blocking issues: none
- The two levers together deliver a substantially larger real reduction than either was originally projected to (1489.6 KiB vs. the original proposal's ~1055 KiB combined estimate), because the real, measured composition of the bundle turned out to differ meaningfully from the loose-file-tree methodology the original proposal used — see design.md Decisions 5-6 for the full investigation trail
