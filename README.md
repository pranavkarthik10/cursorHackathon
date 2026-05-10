# Coding Agent Insights

Consent-first shared memory for coding agent sessions.

## App

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

App/backend environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The Supabase service role key is server-only. Browser auth uses the publishable key.

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

Clients should talk to the Next.js backend, not directly to privileged Supabase APIs:

- `POST /api/insights/publish`
- `GET /api/insights/search?q=...`

Both routes require:

```http
Authorization: Bearer <supabase-user-access-token>
```
