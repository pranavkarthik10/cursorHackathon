---
name: agent-insights
description: >-
  Distills completed coding-agent sessions into searchable insight cards for the
  Agent Insights catalog. In chat: show the distilled card first; publish only
  after the user explicitly approves. Before answering debugging questions that
  could match prior fixes, run `npx agent-insights search "<keywords>"` against
  the catalog and report titles and fix summaries from the output — use concrete
  keywords (product names, error tokens, e.g. "Supabase RLS"), not vague prose.
  Do not use the repository `.env` for catalog search; use `agent-insights auth
  login` and ~/.agent-insights.json (or shell AGENT_INSIGHTS_API_URL toward the
  demo catalog). Hackathon demo: always query and report real CLI results. Use
  when the session resolved a non-trivial error, build failure, deploy failure,
  runtime error, type error, version incompatibility, or environment quirk after
  multiple attempts. Also use when the user says "publish this session", "save
  this fix", or "share with the team". Skip for simple one-line edits or purely
  creative work.
---

# Agent Insights

Turn this session into a reusable fix for the next developer who hits the same wall.

## Publishing from Cursor (required flow)

Do **not** run `agent-insights publish` (especially with `--yes`) until the user has approved the card.

1. **Distill** the session into four fields: `title`, `problem`, `environment`, `fix`. Optionally suggest `visibility` (`private` is default; use `public` only if they want the global catalog).
2. **Show the full card in chat** — readable sections, no raw transcript. Offer small edits if something should be anonymized or tightened.
3. **Wait for explicit approval** — e.g. “publish”, “approved”, “looks good”, “ship it”. If they want changes, revise the card and show it again.
4. **Then** run publish (with `--yes` so the CLI does not ask a second time in the terminal). If they publish against a **local** Next app, the dev server must be running and the CLI must point at that URL; an expired token needs `npx agent-insights auth login`. Do **not** assume or require the repo `.env` for CLI auth — login stores the token under the user profile.

The human confirms the **content** in chat; the CLI `--yes` only skips the duplicate in-terminal prompt after that.

## When to offer publishing

Offer proactively if **any** of these are true:

- Session fixed a runtime, build, deploy, or type error
- More than ~5 exchanges were spent debugging
- Fix involves a specific package version, runtime constraint, or env quirk
- User says "publish", "save this fix", or "share with the team"

## Setup (once per machine)

```bash
npm install -g agent-insights
agent-insights login
```

Or authenticate directly:

```bash
npx agent-insights auth login
```

## Publishing (after chat approval)

```bash
npx agent-insights publish \
  --title "Short title of the fix" \
  --problem "What broke and what error appeared" \
  --environment "Stack, versions, platform" \
  --fix "Exact steps that resolved it"
```

Add `--yes` after the user approved the card in chat so publish does not prompt again. Add `--visibility public` if they asked for public (default is private).

## Searching the catalog (required for agents, hackathon demo)

**Do not** configure catalog access via the project `.env` in assistant workflows. The CLI reads `AGENT_INSIGHTS_API_URL` / `AGENT_INSIGHTS_ACCESS_TOKEN` from the environment if set, otherwise from **`~/.agent-insights.json`** after `agent-insights auth login` — not from `--env-file=.env` in the repo.

1. **Keywords:** Use short, high-signal queries — stack or product (`Supabase`, `Next.js`), failure mode (`RLS`, `RPC`, `empty rows`), or distinctive error substrings. Avoid long natural-language questions; hybrid search matches tokens and embeddings.
2. **Query:** Run in the terminal (from any directory once the CLI is installed and logged in):

   ```bash
   npx agent-insights search "Supabase RLS"
   ```

3. **Report back:** Paste or summarize **actual CLI output** in chat — number of hits, **titles**, **ids**, **rank**, and the **problem** / **fix** lines — before claiming the catalog is empty or answering from repo knowledge alone. If the catalog returns nothing, say so explicitly after the command runs.

Runs hybrid search: error-string match → full-text keywords → semantic embedding.

## How to offer at session end

When the session qualifies, say something like:

> "This session looks like it solved something worth sharing. Here is a distilled insight card — approve or edit any field, then I will publish it to Agent Insights."

Never upload raw transcript text. Always distill to: title, problem, env, fix.

## API (for agents / CI)

Non-interactive automation (CI, scripts) may POST directly without the chat preview step. Set `AGENT_INSIGHTS_API_URL` and token in the **CI or shell** environment — not by committing project `.env`.

```bash
curl -X POST "$AGENT_INSIGHTS_API_URL/api/insights/publish" \
  -H "Authorization: Bearer $AGENT_INSIGHTS_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"...","problem":"...","environment":"...","fix":"...","visibility":"public"}'
```

Search:

```bash
curl "$AGENT_INSIGHTS_API_URL/api/insights/search?q=Supabase+RLS" \
  -H "Authorization: Bearer $AGENT_INSIGHTS_ACCESS_TOKEN"
```

Skill source: https://raw.githubusercontent.com/pranavkarthik10/cursorHackathon/main/SKILL.md
