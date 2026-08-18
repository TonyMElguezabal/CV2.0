# Step 10 Report - Browser Verification

- Date: 2026-08-17
- Change: chatbot-era-collision-guard
- Agent: Claude Code

## Environment
- Dev server: `npm run dev`
- Browser: Claude in Chrome, fresh tab

## curl Results (Task Group 9)

**9.1 — Current-capability question**

```
curl -s -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Jose'\''s cloud experience?"}'
```

Reassembled streamed answer:

> Jose's cloud experience includes leading cloud initiatives and handling
> cloud-related delivery work as a Technical Delivery Manager. The context
> specifically mentions cloud migrations, AI-enabled platform delivery, and
> work at Oracle using Oracle Cloud Infrastructure (OCI), including OCI
> AI/LLM services. [...]

Grounded, current, no legacy tooling. **PASS**.

**9.2 — Off-topic refusal**

```
curl -s -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the weather like today?"}'
```

Reassembled answer: `"I can only answer questions about Jose's professional background."` — exact canonical match. **PASS**.

## Browser Verification

- Loaded the landing page. Hero text (`h1`/positioning) initially rendered at
  `opacity: 0` — this is the same documented automated-background-tab
  rAF-throttling artifact found in a prior session's browser verification
  (`document.visibilityState: "hidden"` pauses framer-motion's animation
  loop in this tooling context), not a real defect. Confirmed: after a real
  click interaction (opening the chat widget), the hero rendered fully —
  consistent with the rAF-throttling diagnosis rather than a broken page.
- Opened the "Ask about Jose" chat widget — starter questions and input
  visible and functional.
- Asked "What lessons has Jose learned in his career?" — broad question,
  answered honestly and generically (cited `#faq`, `#skills`, `#main`),
  correctly declining to over-specify rather than picking one company
  arbitrarily.
- Asked "What lesson did Jose learn at IBM?" — model correctly reported the
  context doesn't contain that specific detail, while still correctly
  attributing what *was* retrieved (role, DB2, SQL, PL/SQL) to IBM
  specifically. A graceful, non-hallucinating refusal, not a failure.
- Asked "What did Jose learn about understanding data flows across
  environments?" (phrasing closer to the actual content) — **this is the
  key verification**. The model returned a near-verbatim rendering of IBM's
  `lessons` field ("Jose learned that understanding data flows across
  multiple environments is critical, because an issue in one layer can
  affect the entire system...") **cited with the `#ibm` anchor**.

This last exchange is direct, concrete proof the fix works: `{id}-lessons`
was one of the three chunk types with **no attribution at all** before this
change (proposal.md "Orphaned chunks"). It is now correctly retrieved and
correctly cited to its source company.

## Screenshots
- `screenshot-1787022382973-8.jpg` — hero fully rendered, chat widget open with starter questions
- `screenshot-1787022409465-9.jpg` — first two exchanges (broad lessons question, IBM-specific graceful refusal)
- `screenshot-1787022440774-10.jpg` — scrolled view showing the data-flows question and its `#ibm`-cited, verbatim-matching answer

## Outcome
- Step 10 status: PASS
- Blocking issues: none
