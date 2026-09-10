---
description: Build/launch/drive recipe for verifying CareerDNA (Next.js App Router site) changes at runtime
---

# Verifying CareerDNA

Static-first Next.js site. No backend, no database. Surface is the
rendered page (GUI) plus two API routes (`/api/chat`, `/api/events`).

## Launch

```bash
npm run dev            # next dev, binds :3000 (check with lsof first — a
                        # stray prior dev server is common in this repo)
```

Wait for readiness with a poll loop, not a sleep:
```bash
until curl -sf --max-time 2 http://localhost:3000/ >/dev/null 2>&1; do sleep 1; done
```

No `OPENAI_API_KEY` needed for `dev` (only `build`'s prebuild chain
requires it, via `.env.local`, loaded automatically).

## Drive it

Use `claude-in-chrome` (`tabs_context_mcp` → `navigate` → `computer`
screenshot/click). The hero has an ambient constellation canvas and an
arrival sequence — screenshot after a short `wait`, not immediately on
navigate, or you'll catch mid-animation state.

**Content changes** (`/content/*.yaml`, `*.md`): rendered directly by
`lib/content/read.ts` at request time in `next dev` — no rebuild needed
to see them in the hero, page `<title>`, career chapters, etc.

**Chatbot / FAQ changes**: ⚠️ **`next dev` does NOT rebuild the RAG
retrieval index, and `npm run prebuild` alone is NOT enough to fix
it — confirmed the hard way (JOS-123 `/verify`), don't re-derive this.**

`next.config.ts`'s `initOpenNextCloudflareForDev()` gives `next dev` a
Cloudflare ASSETS binding, and `lib/rag/retrieve.ts` fetches the index
through that binding (`env.ASSETS.fetch(...)`) — which serves from
**`.open-next/assets/rag-index.json`, not `public/rag-index.json`.**
`npm run prebuild` only writes `lib/rag/index.json` and republishes it
to `public/rag-index.json`; it never touches `.open-next/assets/`. So
after editing `/content` and running `npm run prebuild`, a live chat
question can still return the **pre-edit** answer with no warning —
`public/rag-index.json` is fresh, `.open-next/assets/rag-index.json`
isn't, and dev reads the latter.

**The only thing that actually refreshes what `next dev` serves is:**
```bash
npx opennextjs-cloudflare build    # runs prebuild too, then rebuilds
                                    # .open-next/assets/ from the fresh index
```
Then kill and restart `next dev` — it reads the ASSETS binding fresh
per process start (a dev server started *before* this rebuild will
keep serving the old answer even after the files on disk are current).

Check both files' mtimes and content before trusting a chat answer as
proof a content edit "worked" — don't just check `public/`:
```bash
ls -la public/rag-index.json .open-next/assets/rag-index.json
python3 -c "import json; d=json.load(open('.open-next/assets/rag-index.json')); \
  print([c['id'] for c in d if 'OLD STRING' in json.dumps(c)])"
```

Both `public/rag-index.json` and `.open-next/assets/` are gitignored
build artifacts — a real deploy always runs `npm run build` (prebuild
included) fresh, so this staleness is a **local-only trap**, not
something that reaches production. But it's exactly the kind of thing
that makes a content-edit verification look like a PASS when it isn't
— rebuild and re-check, don't trust a stale dev server. `npm run
prebuild` alone costs OpenAI embedding calls (91 chunks as of 2026-09);
the full `opennextjs-cloudflare build` costs the same plus a `next
build` — cheap either way, but neither is reflexive; run it because you
need to verify a content/FAQ change, not by default.

**Résumé asset** (`public/resume.pdf`): plain static file, always
served fresh, no caching gotcha in dev. Verify via `curl -sI
localhost:3000/resume.pdf` (status/content-type/length) and a SHA-256
diff against the file on disk — cheap and exact, no need to open the
PDF in a browser tab (Chrome's native PDF viewer isn't
screenshot-able through this tooling; use `qlmanage -t` for a visual
check instead if you need one).

## Gotchas already hit here

- A stray `next dev` from a previous session is common — `lsof -nP
  -iTCP:3000 -sTCP:LISTEN` before assuming the port is yours.
- The dev-mode `eval()`-not-supported console notice and `[Upstash
  Redis] Unable to find environment variable` warnings are expected
  locally (no Redis configured in dev) — not signal, don't chase them.
- `window.scrollTo()` does not trigger this app's Framer Motion scroll
  listeners in automated browser sessions; use the `computer` tool's
  real wheel-driven `scroll` action if a test needs scroll-linked
  animation to actually progress.
