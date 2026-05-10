-- Mock insights for demos. Run in Supabase SQL Editor after schema is applied
-- (`npm run db:init` or `supabase db push`). Prefer `npm run seed:insights` for parity with the app.
--
-- Visibilities: public, org, team, private
-- Global ("Community"): public + org + team
-- Mine ("My insights"): rows where created_by = your auth.users.id

insert into public.insights (title, problem, environment, fix, visibility, created_by)
values
  (
    'Next.js 15: Dynamic route params undefined on first client render',
    'useParams() returned undefined for [slug] on the first paint, then populated — caused hydration warnings and a flash of empty state.',
    'Next.js 15, App Router, React 19, Vercel',
    'Read params in the server page (async page.tsx) and pass them as props, or read them inside useEffect for client-only consumption. Add a loading.tsx boundary so the empty state never flashes.',
    'public',
    null
  ),
  (
    'pnpm: workspace package not resolved — ERR_PNPM_WORKSPACE_PKG_NOT_FOUND',
    'Importing an internal workspace package failed in CI even though the package existed locally.',
    'pnpm 9, monorepo with packages/*',
    'Use workspace:* in dependants, ensure pnpm-workspace.yaml globs include the package, and verify the consumed name matches the name field exactly. pnpm install from the repo root after any rename.',
    'public',
    null
  ),
  (
    'Tailwind v4 + PostCSS: @tailwind directives ignored',
    'After upgrading to Tailwind 4, build succeeded but utilities were missing in the browser.',
    'Tailwind CSS 4, @tailwindcss/postcss, Next.js 16',
    'Use @import "tailwindcss" in the CSS entry instead of @tailwind base/components/utilities. Switch postcss.config to @tailwindcss/postcss. Remove leftover Tailwind 3 PostCSS plugins.',
    'public',
    null
  ),
  (
    'Vercel: Edge runtime crash — crypto.subtle not available',
    'A route using bcryptjs worked locally but threw "crypto.subtle is undefined" once deployed to Edge.',
    'Vercel Edge Runtime, Next.js Middleware',
    'Switch to Web Crypto (crypto.subtle.digest) or move the route to the Node.js runtime via export const runtime = "nodejs" if you need bcrypt.',
    'public',
    null
  ),
  (
    'Supabase: search RPC returns empty rows while table has data',
    'search_insights RPC returned no rows in the app but identical SQL in the editor returned rows.',
    'Supabase Postgres, Next.js API route with user JWT',
    'Verify RLS policies allow SELECT for the calling role and that the RPC has GRANT EXECUTE TO authenticated. For admin-only ops, use the service-role client server-side. Confirm requesting_user_id matches auth.uid().',
    'public',
    null
  ),
  (
    'pgvector dimension mismatch on insert',
    'Insert failed: expected 1536 dimensions but the embedding had a different length after switching models.',
    'Supabase pgvector, text-embedding-3-small vs ada-002',
    'Align vector(N) with the model output dimension (1536 for text-embedding-3-small, 3072 for text-embedding-3-large). Re-embed everything after switching models.',
    'public',
    null
  ),
  (
    'React 19 hydration mismatch from Date.now() in server component',
    'Console warned about hydration mismatch on a timestamp rendered server-side.',
    'Next.js 15, React 19, Server Components',
    'Pass timestamps as ISO strings from server to client and format them in a client component, or wrap formatting in suppressHydrationWarning. Avoid Date.now() in render paths.',
    'public',
    null
  ),
  (
    'Drizzle ORM: relation "__drizzle_migrations" does not exist',
    'Running drizzle-kit push errored on a fresh database the first time.',
    'Drizzle ORM, Postgres',
    'Run drizzle-kit generate then drizzle-kit migrate (or push for prototyping). Ensure schema path in drizzle.config.ts is correct and that the DB user has CREATE privileges.',
    'public',
    null
  ),
  (
    'Bun + TypeScript: Cannot find module for path aliases',
    'Imports using @/lib/foo resolved in VS Code but failed at runtime under Bun.',
    'Bun 1.x, TypeScript, tsconfig paths',
    'Mirror tsconfig paths in bunfig.toml under [install] with [install.paths], or switch to relative imports for runtime code. Bun only auto-reads compilerOptions.paths when tsconfig.json is at the project root.',
    'public',
    null
  ),
  (
    'Python: ModuleNotFoundError after uv pip install in a venv',
    'Newly installed package was missing when running the script.',
    'Python 3.12, uv 0.4',
    'Activate the venv before invoking python (source .venv/bin/activate), or call uv run python script.py so uv resolves the venv automatically. which python should point inside .venv/bin/.',
    'public',
    null
  ),
  (
    'Docker: EACCES permission denied on /.next during Next.js build',
    'Next.js build inside a Docker container failed writing to /.next on Linux but worked on macOS.',
    'Docker, Next.js, Node 20 alpine',
    'Run the build as a non-root user with explicit ownership: USER node plus RUN chown -R node:node /app. Avoid mounting host node_modules over the container''s.',
    'public',
    null
  ),
  (
    'GitHub Actions: permission denied to GITHUB_TOKEN on push',
    'Workflow tried to push a commit and failed with 403 even though the token had contents: write.',
    'GitHub Actions, ubuntu-latest',
    'Set permissions: contents: write at the job or workflow level. For protected branches, push to a PR branch or use a fine-grained PAT. Confirm the org allows GITHUB_TOKEN to write.',
    'public',
    null
  ),
  (
    'Stripe webhook signature verification fails in Next.js route',
    'stripe.webhooks.constructEvent threw "No signatures found matching the expected signature for payload".',
    'Next.js App Router, Stripe Node SDK',
    'Read the raw body with await request.text() (not request.json()), then pass that exact string to constructEvent. Use the same Stripe API version that signed the event.',
    'public',
    null
  ),
  (
    'Prisma + Vercel: Too many connections under load',
    'Serverless functions exhausted Postgres connections during a traffic spike.',
    'Vercel, Prisma 5, Supabase Postgres',
    'Use Supabase pooler (port 6543, transaction mode) for runtime, and the direct connection (5432) only for migrations. Set connection_limit=1 in the Prisma URL for serverless.',
    'public',
    null
  ),
  (
    'TypeScript: Type instantiation is excessively deep on Drizzle query',
    'A complex relational query caused TS to bail with "excessively deep and possibly infinite".',
    'Drizzle ORM, TypeScript 5.6',
    'Break the query into smaller subqueries with explicit InferSelectModel types, or annotate the result type manually so the compiler stops trying to widen.',
    'public',
    null
  ),
  (
    'ESLint flat config: rules from next/core-web-vitals not applied',
    'After migrating to eslint.config.mjs, Next-specific rules silently stopped firing.',
    'ESLint 9, Next.js 15',
    'Use @next/eslint-plugin-next directly in flat config — the legacy extends: "next/core-web-vitals" only works under .eslintrc. Register the plugin and copy its recommended rules.',
    'public',
    null
  ),
  (
    'macOS: EMFILE too many open files during dev server',
    'Vite/Next dev crashed with EMFILE after a few HMR cycles in a large monorepo.',
    'macOS, Node 20',
    'Raise the file-descriptor limit: ulimit -n 10240 in your shell profile, and use launchctl limit maxfiles to lift the per-process cap on macOS.',
    'public',
    null
  ),
  (
    'OpenAI Node SDK: streaming response cut off at ~1MB on Vercel',
    'Long completions truncated when piped through a Next.js Edge route.',
    'Vercel Edge, OpenAI Node SDK, Next.js',
    'Return the SDK toReadableStream() directly inside new Response(...) and set headers: { Transfer-Encoding: chunked }. Avoid buffering with await response.text() anywhere upstream.',
    'public',
    null
  ),
  (
    'Internal API gateway: 502 from service-router when timeouts > 30s',
    'Long-running ML inference requests were dropped at the org gateway with a generic 502.',
    'Internal Envoy gateway, gRPC services',
    'Bump both upstream and downstream route.timeout on the listener and set idle_timeout to 120s. For requests > 60s, switch to async job + polling pattern.',
    'org',
    null
  ),
  (
    'Datadog: missing traces from Next.js server actions',
    'Server actions did not appear in APM traces while route handlers did.',
    'Next.js 15, dd-trace 5',
    'Patch react-server-dom instrumentation: enable the experimental nextjs.server_actions integration in dd-trace, and ensure DD_TRACE_ENABLED=true is set on the build, not just runtime.',
    'org',
    null
  ),
  (
    'Org SSO: Cursor login loop after enabling enforced SSO',
    'Engineers were redirected back to the login screen indefinitely after SSO enforcement turned on.',
    'Cursor 0.50+, Okta SAML',
    'Log out fully, clear Cursor''s auth cache (~/Library/Application Support/Cursor/Session), and re-login from a fresh browser tab. Verify the Okta app''s ACS URL matches the new Cursor SSO endpoint.',
    'org',
    null
  ),
  (
    'Snowflake: Statement reached its statement or warehouse timeout',
    'Nightly transform job started failing intermittently after dataset growth.',
    'Snowflake, dbt',
    'Raise STATEMENT_TIMEOUT_IN_SECONDS on the warehouse, or split the model into incremental + full-refresh windows. Confirm clustering keys match the WHERE filters used by the model.',
    'org',
    null
  ),
  (
    'Internal design-system: Button destructive variant missing hover in dark mode',
    'Hover styles applied in light mode but not dark mode after migrating to OKLCH tokens.',
    'Internal DS v3, Tailwind 4, OKLCH tokens',
    'Add the .dark selector variant to the hover token and regenerate tokens. The migration script skipped state-modifier tokens — open a PR against tokens/generate.ts to include them.',
    'org',
    null
  ),
  (
    'Vault: short-lived DB credentials expiring mid-request',
    'API requests sometimes failed with "password authentication failed" under sustained load.',
    'HashiCorp Vault, Postgres dynamic secrets',
    'Set the lease TTL higher than the longest expected request, enable automatic renewal in the Vault Agent sidecar, and add a retry on connection-refused with fresh creds.',
    'org',
    null
  ),
  (
    'AWS SSO: aws sso login opens stale tenant after IdP migration',
    'After moving from Okta to Entra ID, the AWS CLI kept opening the old IdP login page.',
    'AWS CLI v2, AWS IAM Identity Center',
    'Delete ~/.aws/sso/cache/ and the AWS SSO entry in ~/.aws/config, then re-run aws configure sso and pick the new start URL.',
    'org',
    null
  ),
  (
    'Playwright: visual regression flake on /onboarding step 2',
    'Snapshot diff was caused by the animated checklist finishing at different times across runs.',
    'Playwright 1.46, Chromium headless',
    'Disable animations in test setup with page.addStyleTag for *{animation:none!important;transition:none!important} and wait for data-testid=checklist-done before screenshot.',
    'team',
    null
  ),
  (
    'Worker: enqueue job from server action causes duplicate run',
    'When a user double-clicked submit, two identical jobs were enqueued.',
    'BullMQ, Next.js Server Actions',
    'Use the action''s idempotency key (request id) as the BullMQ jobId. Duplicate enqueues with the same jobId are no-ops.',
    'team',
    null
  ),
  (
    'Storybook 8 fails to resolve workspace UI package',
    'Stories from @acme/ui failed to load with "Cannot find module" inside Storybook.',
    'Storybook 8, pnpm workspace, Vite builder',
    'Add the workspace package to optimizeDeps.include in .storybook/main.ts viteFinal, and ensure the package exports map ships ESM.',
    'team',
    null
  ),
  (
    'Inngest: function not found after rename',
    'After renaming a function, scheduled invocations kept hitting the old name and 404ing.',
    'Inngest 3, Next.js',
    'Keep a stub of the old function id and re-export the new one, or run npx inngest-cli@latest deploy --prune to remove old function registrations after the rename ships.',
    'team',
    null
  ),
  (
    'Posthog feature flag: payload mismatch in SSR',
    'Server-rendered pages showed the control variant while the client hydrated to the test variant.',
    'PostHog JS + Node, Next.js App Router',
    'Bootstrap PostHog on the server with posthog-node, pass flagValues into the client provider via context, and call posthog.reloadFeatureFlags() after hydrate only when the user id is known.',
    'team',
    null
  ),
  (
    'Onboarding form: Zod refinement runs before async username check',
    'Form showed "username taken" after the synchronous validation passed, causing two error toasts.',
    'react-hook-form, Zod, Next.js Server Action',
    'Move the uniqueness check out of Zod and into the server action''s response, returning { fieldErrors: { username: [...] } }. Surface server errors via RHF setError instead of re-running Zod.',
    'team',
    null
  );

-- Personal rows: paste your auth.users.id below and uncomment.
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
--     'Personal Vim setup: LSP stops attaching after Neovim 0.10',
--     'tsserver attached on first buffer only; subsequent buffers had no diagnostics.',
--     'Neovim 0.10, lspconfig',
--     'Pin typescript-tools.nvim instead of vanilla tsserver, and ensure single_file_support = true is off when working in workspaces.',
--     'private',
--     '00000000-0000-0000-0000-000000000000'::uuid
--   ),
--   (
--     'Team: in-repo lint preset rejects optional chaining in tests',
--     'Our shared eslint preset disallowed ?. inside test files, but it''s idiomatic.',
--     'Custom eslint preset, Jest',
--     'Override no-unsafe-optional-chaining and @typescript-eslint/no-non-null-assertion for **/*.test.ts in the preset.',
--     'team',
--     '00000000-0000-0000-0000-000000000000'::uuid
--   ),
--   (
--     'Org tip: faster CI by caching pnpm store between matrix jobs',
--     'Each matrix job re-downloaded pnpm packages, adding ~90s per job.',
--     'GitHub Actions, pnpm 9',
--     'Cache ~/.local/share/pnpm/store keyed on the pnpm-lock hash. Restore in a setup step before pnpm install --frozen-lockfile.',
--     'org',
--     '00000000-0000-0000-0000-000000000000'::uuid
--   ),
--   (
--     'Published: hybrid search ranking tweak from my session',
--     'Empty search ranked all rows at zero; wanted recent-first for browse mode.',
--     'Postgres ts_rank_cd, Next.js',
--     'Order by rank desc, created_at desc; treat empty query as browse (rank 0 for all rows).',
--     'public',
--     '00000000-0000-0000-0000-000000000000'::uuid
--   );
