# AGENTS.md

## Project

Coding Agent Insights is a consent-first shared memory layer for coding agent sessions.

The core idea:

- Coding agent sessions are mostly isolated today.
- When one user solves a niche, painful coding issue, another user who hits the same issue usually has to rediscover the fix.
- This project turns successful agent sessions into searchable, reusable insight cards.
- The product should feel less like a generic knowledge base and more like Stack Overflow for hard-won coding-agent fixes.

## Product Shape

The preferred user flow is:

1. A user finishes a difficult coding-agent session.
2. The agent or CLI detects that the session likely solved a reusable issue.
3. The tool asks for consent before publishing anything.
4. The user previews an anonymized, distilled insight card.
5. The user can publish publicly, publish to a team, save locally, or skip.
6. Later, another user or agent can search for similar issues and retrieve the relevant fix.

Default behavior should publish distilled insights, not raw transcripts.

Raw transcripts may contain secrets, proprietary code, private repo names, customer data, personal notes, and low-signal agent chatter. Any raw evidence should be optional, redacted, and clearly previewed before upload.

## CLI

The project should include an `agent-insights` CLI. The CLI is the agent-native entry point and should support the hackathon demo loop.

Initial commands to design around:

- `agent-insights publish`: ingest a transcript or session export, extract an insight, show a preview, and publish after confirmation.
- `agent-insights search`: search for prior insights from an error message, stack trace, or short problem description.
- `agent-insights init`: configure local project settings and API credentials.

The CLI should make the product feel like something coding agents can call at the end of a session.

## Minimum Insight Model

Do not overbuild the insight schema early. A useful v0 should work with a very small card:

- `title`
- `problem`
- `environment`
- `fix`
- `visibility`
- `embedding`

Treat error signatures, tags, failed approaches, root cause, package versions, line references, evidence chunks, confidence, and outcomes as optional derived metadata. Add them only when they clearly improve the publish/search loop.

The most important v0 behavior is retrieval quality:

- exact or fuzzy matching on error strings
- semantic matching on problem and solution
- filtering or boosting by environment
- a concise explanation of why a result matches

## Tech Stack Preference

For hackathon speed, prefer:

- Next.js for the web app
- Tailwind and shadcn/ui for UI
- Supabase Postgres for data
- pgvector for embeddings
- Postgres full-text search for exact coding errors
- OpenAI for extraction, redaction, embeddings, and reranking
- Vercel for deployment

Keep infrastructure simple until the demo loop is strong.

## Task Clusters

Split the build into clear clusters so work can move quickly without turning the hackathon into infrastructure soup.

1. CLI spine

Build `agent-insights` first. It should provide the core commands `init`, `publish`, and `search`. This proves the product is agent-native instead of only being a web form.

2. Insight extraction

Take transcript or session text and produce the tiny MVP insight card. Run redaction before preview or upload.

3. Storage and search

Use Supabase Postgres with an `insights` table, a pgvector embedding column, simple keyword or full-text search, and a hybrid search path.

4. Web app

Build a lightweight dashboard with publish/preview, search, and insight detail views. The web app should mirror the CLI flow instead of becoming a separate product.

5. Agent integration

Make the product easy for coding agents to call at session end. Include a session-end hook pattern, a "looks solved, publish?" prompt, local config, and sample usage docs for tools like Codex, Claude Code, and Cursor.

6. Trust and privacy

Add MVP guardrails: secret redaction, preview before upload, visibility controls, and no raw transcript upload by default.

7. Demo data and pitch flow

Seed a few realistic niche issues, such as Next.js/Vercel runtime errors, pnpm workspace resolution errors, and package/version mismatch errors. The demo should show publishing a solved session, searching from a similar stuck issue, and getting the fix back.

Preferred implementation order:

1. CLI
2. Minimal schema
3. Extract insight
4. Store and search
5. Web UI
6. Privacy polish
7. Demo polish

## Repository Workflow

<!-- Commit and create pull requests for all meaningful changes.

Do not use the `codex/` branch prefix for this repository. Use short descriptive branch names unless the user requests a specific name. -->

Before committing:

- inspect `git status`
- do not revert unrelated user changes
- run relevant formatting, linting, or tests when available
- include a concise commit message

<!-- After committing, push the branch and create a pull request when remote access is configured. -->
