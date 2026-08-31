---
title: About This Site
topics:
  - architecture
  - content
  - chatbot
---

## What This Site Is

This site, CareerDNA, is Jose Muñoz's interactive professional profile —
a static-first Next.js application where career history, projects,
skills, and FAQ content live as structured, version-controlled files,
kept strictly separate from the components that render them. That
same content is the single source of truth for both the pages a
visitor reads and the chat assistant a visitor can ask questions of,
so nothing shown on the site and nothing the chatbot says comes from
two different places — it's one evidence base, reused.

## How The Chatbot Works

Mar.IA, the chat assistant on this page, is itself a working example of the
kind of AI-powered delivery Jose has led elsewhere: at build time, the
site's content is split into semantic chunks — one per career-chapter
section, project, skill, and FAQ pair — and each chunk is embedded
into a retrieval index. When a visitor asks a question, the assistant
retrieves the chunks most relevant to that question and generates an
answer grounded only in what was retrieved, speaking about Jose in the
third person. Each answer carries citations linking back to the
section of the site the answer was drawn from, and a question the
retrieved content doesn't cover is declined rather than guessed at.
