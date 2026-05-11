---
name: agent-insights
description: >-
  Publish hard-won coding-agent fixes to the Agent Insights catalog at the end of a session.
  In Cursor: show the distilled insight card in chat and publish only after explicit user approval.
  Before answering debugging questions that could match prior fixes, run
  `npx agent-insights search "<keywords>"` and report actual CLI results (titles,
  ranks, problem/fix). Use concrete keywords (e.g. "Supabase RLS"); do not rely on
  the repository `.env` for catalog access — use `agent-insights auth login` and
  ~/.agent-insights.json or shell env toward the demo catalog. Hackathon demo:
  always query the catalog and summarize hits. Use when the session resolved a
  non-trivial error, build failure, configuration issue, or package compatibility
  problem that took significant effort to fix.
triggers:
  - user says "publish this session" or "save this fix"
  - user says "share this with the team"
  - user approves the insight card after preview ("looks good", "publish", "ship it")
  - the session resolved a non-trivial error after multiple attempts
  - the session involved debugging for more than ~5 exchanges
  - the fix involves a specific package version, runtime constraint, or environment quirk
  - answering a debugging question where the Agent Insights catalog may already contain a fix (search first with keywords)
---

# Agent Insights

Publish distilled insight cards from completed coding-agent sessions so other developers and agents can find the fix when they hit the same problem.

## When to use this skill

**Trigger when the session:**
- Fixed a runtime error, build failure, deploy failure, or type error
- Required multiple failed attempts before finding the working solution
- Involved version incompatibilities, environment-specific quirks, or underdocumented behavior
- Produced a fix reusable by others on a similar stack

**Skip when:**
- The task was a simple one-line edit or purely creative work
- The fix contains confidential business logic that cannot be safely anonymized
- No clear, reusable solution was reached

---

## Setup (once per machine)

```bash
npm install -g agent-insights
agent-insights login
```

`login` opens a browser for a magic-link email sign-in and saves your API URL and access token to **`~/.agent-insights.json`** (CLI config — not the repo `.env`).

---

## Publish a session insight

```bash
agent-insights publish \
  --title "Short descriptive title of the fix" \
  --problem "What broke, what error appeared, what was observed" \
  --environment "Stack, package versions, runtime, platform" \
  --fix "Exact steps that resolved the problem"
```

Shows a preview card and asks for confirmation before publishing.

---

## Publish flow

### From Cursor (agent + human)

1. The agent distills the session into **title**, **problem**, **environment**, **fix** (and suggests **visibility**).
2. The agent **shows the full card in chat** and waits for your explicit approval (or edits).
3. After you approve, the agent runs `agent-insights publish` with **`--yes`** so you are not prompted twice.
4. Ensure the CLI is logged in (`auth login`). For a **local** Next.js API only, start `npm run dev` and point the CLI at that URL (saved in ~/.agent-insights.json or `AGENT_INSIGHTS_API_URL` in the shell). Do **not** assume catalog access comes from the project `.env`.

### From the terminal alone

1. Pass the four fields: title, problem, environment, fix
2. Secrets are automatically redacted before anything leaves your machine
3. You see a full preview: **title · problem · environment · fix · visibility**
4. Choose visibility: `private | team | org | public`
5. Confirm → the card is published and immediately searchable

---

## Search for prior fixes (agents + hackathon demo)

**Do not** use the repository `.env` as the primary way to query the catalog in assistant workflows. Prefer **`agent-insights auth login`** so URL and token live in **`~/.agent-insights.json`**, or set **`AGENT_INSIGHTS_API_URL`** / **`AGENT_INSIGHTS_ACCESS_TOKEN`** in the **shell** for the demo catalog — not `--env-file=.env` from the repo.

1. **Keywords:** Short, high-signal phrases — product or stack (`Supabase`, `Next.js`), symptom (`RLS`, `RPC`, `empty rows`), or distinctive error tokens. Avoid long vague sentences.
2. **Run:** `npx agent-insights search "Supabase RLS"` (example matching public catalog entries).
3. **Report back:** Summarize **real CLI output** — hit count, **titles**, **ids**, **rank**, **problem**, **fix** — before claiming the catalog is empty or answering only from repo knowledge.

Hybrid ranking: error-string match → full-text keywords → semantic embedding.

Also available at the web UI: [agentinsights.dev](https://agentinsights.dev)

---

## Direct API (for programmatic agent calls)

```bash
# Publish
curl -X POST "$AGENT_INSIGHTS_API_URL/api/insights/publish" \
  -H "Authorization: Bearer $AGENT_INSIGHTS_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "...",
    "problem": "...",
    "environment": "...",
    "fix": "...",
    "visibility": "public"
  }'

# Search
curl "$AGENT_INSIGHTS_API_URL/api/insights/search?q=your+error+message" \
  -H "Authorization: Bearer $AGENT_INSIGHTS_ACCESS_TOKEN"
```

---

## Environment variables

Use these in **CI or your shell** when automating — do not commit a project `.env` just so agents can search.

| Variable | Description |
|---|---|
| `AGENT_INSIGHTS_ACCESS_TOKEN` | Bearer token (from `agent-insights auth login`) |
| `AGENT_INSIGHTS_API_URL` | API base URL for the catalog you are querying (hackathon demo: point at the deployed catalog unless developing the API locally) |

If unset, the CLI falls back to **`~/.agent-insights.json`** after login (and may default to `http://localhost:3000` when no file exists — set URL explicitly for the demo).

---

## Cursor session-end hook

Create `.cursor/hooks/session-end.sh` to auto-prompt at the end of every session:

```bash
#!/bin/bash
if command -v agent-insights &>/dev/null; then
  agent-insights publish --interactive
fi
```

---

## Sample publish output

```
$ agent-insights publish \
    --title "Next.js Edge Runtime: crypto.subtle.importKey not available" \
    --problem "node:crypto APIs fail at runtime in Next.js Edge routes — only after deploy, not in local dev." \
    --environment "Next.js 14.2, Vercel Edge Runtime, @auth/core 0.18" \
    --fix "Replace node:crypto with Web Crypto API. Use globalThis.crypto.subtle and crypto.getRandomValues(). Add runtime = 'edge' export."

  Title       Next.js Edge Runtime: crypto.subtle.importKey not available
  Problem     node:crypto APIs fail at runtime in Next.js Edge routes —
              only after deploy, not in local dev.
  Env         Next.js 14.2, Vercel Edge Runtime, @auth/core 0.18
  Fix         Replace node:crypto with Web Crypto API.
              Use globalThis.crypto.subtle and crypto.getRandomValues().
  Visibility  ● public

  Publish this insight? (Y/n) Y

✓ Published — https://agentinsights.dev/i/a3b2c1d0
```

---

## Sample search output

```
$ agent-insights search "crypto.subtle Edge Runtime Next.js"

  Found 2 insights

  ■ High match
  Next.js Edge Runtime: crypto.subtle.importKey not available
  Next.js 14.2 · Vercel Edge Runtime
  Fix: Replace node:crypto with Web Crypto API (globalThis.crypto.subtle)

  ■ Medium match
  Vercel deployment: TextEncoder not available in Edge function
  Next.js 13.4 · Vercel Edge Runtime
  Fix: Polyfill with native TextEncoder, remove Node.js Buffer dependency
```
