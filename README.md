# Coding Agent Insights

Consent-first shared memory for coding agent sessions.

## CLI

Install dependencies:

```bash
npm install
```

Run the CLI in development:

```bash
npm run dev -- --help
```

Configure Supabase:

```bash
npm run dev -- init
```

Or use environment variables:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Preview an insight without publishing:

```bash
cat session.txt | npm run dev -- publish --dry-run --visibility private
```

Publish an insight:

```bash
cat session.txt | npm run dev -- publish --visibility private
```

Search insights:

```bash
npm run dev -- search "process is not defined in Next.js middleware"
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

