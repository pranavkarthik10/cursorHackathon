-- Mock insights for demos. Run in Supabase SQL Editor (requires schema from schema.sql).
--
-- Community catalog (global scope): public + team rows — visible to everyone.
-- Personal ("My insights"): set :personal_user to your auth.users.id and uncomment the second INSERT block,
-- or use `npm run seed:insights` with SEED_PERSONAL_USER_ID in .env.

insert into public.insights (title, problem, environment, fix, visibility, created_by)
values
  (
    'Next.js 15: Dynamic route params undefined on first render in client component',
    'useParams() in a client component returned undefined for slug on the first paint, then populated — caused hydration warnings and a flash of empty state.',
    'Next.js 15, App Router, React 19, Vercel',
    'Read params from the server page (async page.tsx) and pass them as props, or use useParams inside useEffect for client-only reads. Avoid using param values synchronously in the first client render without a loading boundary.',
    'public',
    null
  ),
  (
    'pnpm: workspace package not resolved — ERR_PNPM_WORKSPACE_PKG_NOT_FOUND',
    'Importing an internal workspace package failed in CI with ERR_PNPM_WORKSPACE_PKG_NOT_FOUND even though the package existed locally.',
    'pnpm 9, monorepo with packages/*',
    'Ensure the dependency in package.json uses workspace:* (or correct protocol), run pnpm install from the repo root, and that pnpm-workspace.yaml globs include the package path. Verify the consumed package name matches the name field in its package.json exactly.',
    'public',
    null
  ),
  (
    'Supabase RLS: RPC returns empty rows while table has data',
    'search_insights RPC returned no rows in the app but identical SQL in the SQL editor with service role showed rows.',
    'Supabase Postgres, Next.js API route with user JWT',
    'Check that the RPC runs as the invoker and RLS policies allow SELECT for that role. For admin-only operations, use the service role client on the server only, never in the browser. Confirm requesting_user_id and scope match your filter logic.',
    'public',
    null
  ),
  (
    'Tailwind v4 + PostCSS: @tailwind directives ignored',
    'After upgrading to Tailwind 4, styles did not apply; build succeeded but utilities were missing.',
    'Tailwind CSS 4, @tailwindcss/postcss, Next.js 16',
    'Use @import "tailwindcss" in your CSS entry instead of @tailwind base/components/utilities, and ensure postcss.config uses @tailwindcss/postcss. Remove conflicting old PostCSS plugins that process Tailwind twice.',
    'team',
    null
  ),
  (
    'OpenAI embedding dimension mismatch with pgvector column',
    'Insert failed: expected 1536 dimensions but vector had a different length when switching embedding models.',
    'Supabase pgvector, text-embedding-3-small vs ada-002',
    'Align the vector(N) column size with the model output (e.g. 1536 for text-embedding-3-small). Either migrate the column dimension or always use one model. Regenerate embeddings after any model change.',
    'team',
    null
  );

-- Personal rows: replace the UUID with your user id from Authentication → Users, then run.
-- insert into public.insights (title, problem, environment, fix, visibility, created_by)
-- values
--   (
--     'Local dev: port 3000 already in use',
--     'next dev failed with EADDRINUSE on 3000 after a crashed process.',
--     'macOS, Next.js dev server',
--     'Run lsof -i :3000, kill the stale PID, or start with next dev -p 3001.',
--     'private',
--     '00000000-0000-0000-0000-000000000000'::uuid
--   ),
--   (
--     'Draft: Cursor transcript export path',
--     'Needed a stable path for agent-insights publish from Cursor exports.',
--     'Cursor, macOS',
--     'Point the CLI at the exported JSONL path from agent transcripts; confirm file is redacted before publish.',
--     'private',
--     '00000000-0000-0000-0000-000000000000'::uuid
--   ),
--   (
--     'Published from my session: hybrid search ranking tweak',
--     'Empty search query ranked all rows at zero; wanted recent-first for browse mode.',
--     'Postgres ts_rank_cd, Next.js',
--     'Order by rank desc, then created_at desc; treat empty query as browse (rank 0 for all).',
--     'public',
--     '00000000-0000-0000-0000-000000000000'::uuid
--   );
