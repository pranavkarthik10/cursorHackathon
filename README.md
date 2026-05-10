# Coding Agent Insights

Consent-first shared memory for coding agent sessions.

## CLI

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run the CLI in development:

```bash
npm run dev:cli -- --help
```

App/backend environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The CLI should not receive the Supabase service role key.

Authenticate the CLI with the app API and a user access token:

```bash
npm run dev:cli -- auth --api-url http://localhost:3000 --token <supabase-access-token>
```

You can also use:

```bash
AGENT_INSIGHTS_API_URL=http://localhost:3000
AGENT_INSIGHTS_ACCESS_TOKEN=...
```

Preview an insight without publishing:

```bash
cat session.txt | npm run dev:cli -- publish --dry-run --visibility private
```

Publish an insight:

```bash
cat session.txt | npm run dev:cli -- publish --visibility private
```

Search insights:

```bash
npm run dev:cli -- search "process is not defined in Next.js middleware"
```

## Supabase

Run the SQL in `supabase/schema.sql` against the Supabase project before publishing or searching.

The MVP uses one `insights` table with:

- `title`
- `problem`
- `environment`
- `fix`
- `visibility`
- `embedding`

Search currently uses Postgres full-text search. The `embedding` column is included so semantic search can be added without changing the core table shape.

## Backend API

The CLI talks to the Next.js backend, not directly to Supabase:

- `POST /api/insights/publish`
- `GET /api/insights/search?q=...`

Both routes require:

```http
Authorization: Bearer <supabase-user-access-token>
```
