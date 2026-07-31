# Step 11 Report - E2E Chat Widget Testing via Chrome MCP

- Date: 2026-07-30
- Change: chatbot-corpus-coverage
- Agent: Claude Code

This repo has no Playwright MCP configured — per the adaptation note at the
top of `tasks.md`, E2E testing was performed via the `claude-in-chrome` MCP
against the same production server left running from Step 10
(`npm run start`, index rebuilt from the 86-chunk corpus).

## Scenarios Executed

### 11.1-11.2 — Navigate and open the chat widget

Navigated to `http://localhost:3000` in a new Chrome MCP tab. Page
rendered correctly (hero, career timeline, chat trigger visible bottom
right). Clicked the "Ask about Jose" trigger button — the chat panel
opened, showing the greeting and five starter questions ("Who is Jose?",
"What problems has he solved?", etc.), matching `content/profile.yaml`'s
`chat.greeting`.

### 11.3 — Ticket's original question through the UI

Typed "What AI tools are you using at work or outside of work?" and
submitted. After the thinking indicator, the panel rendered:

> "Jose has worked with AI/LLM services and retrieval-augmented generation
> (RAG) systems. From the context, he used Oracle Cloud Infrastructure's
> AI/LLM services, managed a RAG chatbot integration, and coordinated an
> AI-powered background-removal tool built on a machine-learning
> image-segmentation model. The context does not list a broader set of AI
> tools beyond those examples. If helpful, someone could ask: 'What AI
> projects has Jose delivered?' or 'What was Jose's role in the RAG
> chatbot?' I can go deeper."

Citation chips rendered: `#faq`, `#skills`, `#ai-background-removal`,
`#oracle-projects`. Third person, substantive, not the canonical refusal —
confirms the ticket's original complaint is resolved.

### 11.4 — Site-meta question, third-person check

Typed "How was this site built?" and submitted. Response (scrolled into
view):

> "The site was built as a content-first Next.js application. Jose's
> profile content is stored in structured, version-controlled files,
> separate from the rendering components. At build time, that content is
> split into semantic chunks, embedded into a retrieval index, and used by
> the chat assistant to answer questions from retrieved site content
> only, with citations back to the relevant sections. The context does
> not say more about the implementation details. If helpful, the visitor
> could ask about the content model, the chat retrieval flow, or how
> citations work."

Refers to "the site", "Jose's profile content", and "the chat assistant" —
third person throughout, no first-person persona adoption ("I am..."),
satisfying the `chatbot-eval-and-ship-gate` spec scenario "A question
about the site stays within the professional boundary."

### 11.5 — Citation deep-link verification

Citation chips for this answer: `#faq`, `#chat`, `#tcs-bcp-projects`.
Clicked the `#chat` chip — the tab's URL updated to
`http://localhost:3000/#chat`, confirming the anchor resolves to the real
`id="chat"` element added to `components/ChatWidget.tsx` in Group 6 (not
a broken/invented anchor).

### 11.6 — Console error check

Reloaded the page fresh (to ensure console tracking captured the full
page-load lifecycle) and checked with `read_console_messages`
(`onlyErrors: true`, pattern `.`): **no console errors or exceptions**.

### 11.7 — Cleanup

Closed the Chrome MCP tab (`tabs_close_mcp`) and stopped the production
server (`lsof -ti:3000 | xargs kill`); confirmed `curl` to `localhost:3000`
now fails to connect.

## Outcome

- Step 11 status: **PASS**
- Blocking issues: none.
