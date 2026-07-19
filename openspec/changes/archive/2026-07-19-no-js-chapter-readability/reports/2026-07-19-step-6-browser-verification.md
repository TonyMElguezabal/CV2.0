# Step 6 Report - Browser/E2E Verification

- Date: 2026-07-19
- Change: no-js-chapter-readability
- Story: JOS-84 ([3.3c] No-JS chapter readability)
- Agent: Claude Code

## Environment

- `next dev` (Turbopack) on `http://localhost:3000`, `.next` cache cleared before starting
- Verified live via the `mcp__claude-in-chrome` browser extension (confirmed connected)

## 6.1/6.2/6.3 — Real per-tab JavaScript-disable: attempted, still blocked

Two independent attempts were made to disable JavaScript for real in this session, retrying beyond what JOS-54 attempted:

1. Navigating a new tab to `chrome://settings/content/javascript` — blocked with "Can't interact with browser-internal or unparseable URLs."
2. Opening Chrome DevTools via the `cmd+alt+i` keyboard shortcut (to reach DevTools' command palette and its "Disable JavaScript" command) — no DevTools panel appeared; the shortcut does not reach actual browser-chrome UI through this automation surface.

**Conclusion**: real per-tab JS-disable remains unreachable via `mcp__claude-in-chrome` in this environment, consistent with JOS-54's finding. Per design.md Decision 1's stated contingency, falling back to the SSR-HTML-based verification method, which is real, repeatable evidence:

- `curl http://localhost:3000/` (performed pre-proposal and re-confirmed during this story) shows all seven §F3 sections' real content present in the raw HTML response, with plain native `<details>`/`<summary>` tags — not gated behind any client-only rendering.
- `components/CareerChapters.ssr.test.tsx` (Section 1/4) proves the same thing at the unit-test level via `renderToStaticMarkup`, which performs zero client-side JavaScript execution by construction.
- Native `<details>`/`<summary>` toggle via built-in browser behavior is a well-established web platform guarantee, not something specific to this implementation that requires re-proving per browser — the relevant question was whether *this component's markup* uses that native mechanism without a JS-dependent wrapper, which the SSR HTML confirms it does.

This is a real, honest, but indirect form of verification — documented as such rather than upgraded to a claimed full live JS-disabled test.

## 6.4 — JS-enabled visual and hydration check

- Reloaded with JavaScript enabled (normal browsing). Scrolled to the chapter section: the chevron (`▸`) is visible before the collapsed heading — screenshot confirms it, no hover needed.
- Clicked the chapter summary: `document.querySelector("details").open` became `true`, and a zoomed screenshot confirms the chevron rotated from `▸` to `▾`.
- Checked browser console (`read_console_messages`, pattern `error|warn|hydrat`) after both the initial page load and the click interaction: no matches — only routine `[HMR] connected` log lines were present at any point, no React hydration mismatch warnings or errors.

## Outcome

- Step 6 status: PASS
- Blocking issues: none
- Non-blocking, unchanged gap: true per-tab JavaScript-disable remains unreachable via this browser automation tooling — retried with two different approaches this story, both still blocked. SSR-HTML-based verification stands as the real, sufficient evidence in its place.
