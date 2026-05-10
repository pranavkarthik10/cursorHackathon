/**
 * Seeds mock insights across all four visibilities (public, org, team, private).
 *
 * Apply schema first: `npm run db:init` (needs DATABASE_URL) or paste `supabase/schema.sql` in the SQL Editor.
 *
 * Run from repo root:
 *   npm run seed:insights
 *
 * Set SEED_PERSONAL_USER_ID in .env to also seed private + your owned-public rows
 * (find your UUID at Supabase → Authentication → Users).
 */

import { createClient } from "@supabase/supabase-js";

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const personalUserId = process.env.SEED_PERSONAL_USER_ID?.trim();

if (!url || !key) {
  console.error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!/^https?:\/\//i.test(url)) {
  console.error(
    "SUPABASE_URL must be the HTTPS project URL from Supabase → Settings → API (e.g. https://xxxx.supabase.co), not a postgres:// connection string or empty value."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

/** @type {Array<{title:string,problem:string,environment:string,fix:string,visibility:'public'|'org'|'team'|'private',created_by:string|null}>} */
const communityInsights = [
  // -------- public (broadly useful) --------
  {
    title: "Next.js 15: Dynamic route params undefined on first client render",
    problem:
      "useParams() returned undefined for [slug] on the first paint, then populated — caused hydration warnings and a flash of empty state.",
    environment: "Next.js 15, App Router, React 19, Vercel",
    fix: "Read params in the server page (async page.tsx) and pass them as props, or read them inside useEffect for client-only consumption. Add a loading.tsx boundary so the empty state never flashes.",
    visibility: "public",
    created_by: null
  },
  {
    title: "pnpm: workspace package not resolved — ERR_PNPM_WORKSPACE_PKG_NOT_FOUND",
    problem:
      "Importing an internal workspace package failed in CI even though the package existed locally.",
    environment: "pnpm 9, monorepo with packages/*",
    fix: "Use `workspace:*` in dependants, ensure `pnpm-workspace.yaml` globs include the package, and verify the consumed name matches the `name` field exactly. `pnpm install` from the repo root after any rename.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Tailwind v4 + PostCSS: @tailwind directives ignored",
    problem:
      "After upgrading to Tailwind 4, build succeeded but utilities were missing in the browser.",
    environment: "Tailwind CSS 4, @tailwindcss/postcss, Next.js 16",
    fix: 'Use `@import "tailwindcss"` in the CSS entry instead of `@tailwind base/components/utilities`. Switch postcss.config to `@tailwindcss/postcss`. Remove leftover Tailwind 3 PostCSS plugins.',
    visibility: "public",
    created_by: null
  },
  {
    title: "Vercel: Edge runtime crash — `crypto.subtle` not available",
    problem:
      "A route using `bcryptjs` worked locally but threw 'crypto.subtle is undefined' once deployed to Edge.",
    environment: "Vercel Edge Runtime, Next.js Middleware",
    fix: "Switch to the Web Crypto API (`crypto.subtle.digest`) or move the route to the Node.js runtime via `export const runtime = 'nodejs'` if you need bcrypt.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Supabase: search RPC returns empty rows while table has data",
    problem:
      "search_insights RPC returned no rows in the app but identical SQL in the editor returned rows.",
    environment: "Supabase Postgres, Next.js API route with user JWT",
    fix: "Verify RLS policies allow SELECT for the calling role and that the RPC has `GRANT EXECUTE TO authenticated`. For admin-only ops, use the service-role client server-side. Confirm `requesting_user_id` matches `auth.uid()`.",
    visibility: "public",
    created_by: null
  },
  {
    title: "pgvector dimension mismatch on insert",
    problem:
      "Insert failed: expected 1536 dimensions but the embedding had a different length after switching models.",
    environment: "Supabase pgvector, text-embedding-3-small vs ada-002",
    fix: "Align `vector(N)` with the model's output dimension (1536 for text-embedding-3-small, 3072 for text-embedding-3-large). Re-embed everything after switching models.",
    visibility: "public",
    created_by: null
  },
  {
    title: "React 19 hydration mismatch from `Date.now()` in server component",
    problem:
      "Console warned about hydration mismatch on a timestamp rendered server-side.",
    environment: "Next.js 15, React 19, Server Components",
    fix: "Pass timestamps as ISO strings from server to client and format them in a client component, or wrap formatting in suppressHydrationWarning. Avoid `Date.now()` in render paths.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Drizzle ORM: `relation \"__drizzle_migrations\" does not exist`",
    problem:
      "Running drizzle-kit push errored on a fresh database the first time.",
    environment: "Drizzle ORM, Postgres",
    fix: "Run `drizzle-kit generate` then `drizzle-kit migrate` (or `push` for prototyping). Ensure the schema path in drizzle.config.ts is correct and that the DB user has CREATE privileges.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Bun + TypeScript: 'Cannot find module' for path aliases",
    problem:
      "Imports using `@/lib/foo` resolved in VS Code but failed at runtime under Bun.",
    environment: "Bun 1.x, TypeScript, tsconfig paths",
    fix: "Mirror tsconfig paths in `bunfig.toml` under `[install]` with `[install.paths]` or, simpler, switch to relative imports for runtime code. Bun only auto-reads `compilerOptions.paths` when `tsconfig.json` is at the project root.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Python: `ModuleNotFoundError` after `uv pip install` in a venv",
    problem:
      "Newly installed package was missing when running the script.",
    environment: "Python 3.12, uv 0.4",
    fix: "Activate the venv before invoking python (`source .venv/bin/activate`), or call `uv run python script.py` so uv resolves the venv automatically. `which python` should point inside `.venv/bin/`.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Docker: `EACCES: permission denied, open '/.next'`",
    problem:
      "Next.js build inside a Docker container failed writing to /.next on Linux but worked on macOS.",
    environment: "Docker, Next.js, Node 20 alpine",
    fix: "Run the build as a non-root user with explicit ownership: `USER node` plus `RUN chown -R node:node /app`. Avoid mounting host node_modules over the container's.",
    visibility: "public",
    created_by: null
  },
  {
    title: "GitHub Actions: 'permission denied to GITHUB_TOKEN' on push",
    problem:
      "Workflow tried to push a commit and failed with 403 even though the token had `contents: write`.",
    environment: "GitHub Actions, ubuntu-latest",
    fix: "Set `permissions: contents: write` at the job or workflow level. For protected branches, push to a PR branch or use a fine-grained PAT. Confirm the org allows GITHUB_TOKEN to write.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Stripe webhook signature verification fails in Next.js route",
    problem:
      "`stripe.webhooks.constructEvent` threw 'No signatures found matching the expected signature for payload'.",
    environment: "Next.js App Router, Stripe Node SDK",
    fix: "Read the raw body with `await request.text()` (not `request.json()`), then pass that exact string to constructEvent. Use the same Stripe API version that signed the event.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Prisma + Vercel: 'Too many connections' under load",
    problem:
      "Serverless functions exhausted Postgres connections during a traffic spike.",
    environment: "Vercel, Prisma 5, Supabase Postgres",
    fix: "Use Supabase pooler (port 6543, transaction mode) for runtime, and the direct connection (5432) only for migrations. Set `connection_limit=1` in the Prisma URL for serverless.",
    visibility: "public",
    created_by: null
  },

  // -------- org (broad org knowledge, not necessarily team-specific) --------
  {
    title: "Internal API gateway: 502 from `service-router` when timeouts > 30s",
    problem:
      "Long-running ML inference requests were dropped at the org gateway with a generic 502.",
    environment: "Internal Envoy gateway, gRPC services",
    fix: "Bump both upstream and downstream `route.timeout` on the listener and set `idle_timeout` to 120s. For requests > 60s, switch to async job + polling pattern.",
    visibility: "org",
    created_by: null
  },
  {
    title: "Datadog: missing traces from Next.js server actions",
    problem:
      "Server actions did not appear in APM traces while route handlers did.",
    environment: "Next.js 15, dd-trace 5",
    fix: "Patch `react-server-dom` instrumentation: enable the experimental `nextjs.server_actions` integration in dd-trace, and ensure DD_TRACE_ENABLED=true is set on the build, not just runtime.",
    visibility: "org",
    created_by: null
  },
  {
    title: "Org SSO: Cursor login loop after enabling enforced SSO",
    problem:
      "Engineers were redirected back to the login screen indefinitely after SSO enforcement turned on.",
    environment: "Cursor 0.50+, Okta SAML",
    fix: "Log out fully, clear Cursor's auth cache (`~/Library/Application Support/Cursor/Session`), and re-login from a fresh browser tab. Verify the Okta app's ACS URL matches the new Cursor SSO endpoint.",
    visibility: "org",
    created_by: null
  },
  {
    title: "Snowflake: 'Statement reached its statement or warehouse timeout'",
    problem:
      "Nightly transform job started failing intermittently after dataset growth.",
    environment: "Snowflake, dbt",
    fix: "Raise `STATEMENT_TIMEOUT_IN_SECONDS` on the warehouse, or split the model into incremental + full-refresh windows. Confirm clustering keys match the WHERE filters used by the model.",
    visibility: "org",
    created_by: null
  },
  {
    title: "Internal design-system: Button variant 'destructive' missing hover state in dark mode",
    problem:
      "Hover styles applied in light mode but not dark mode after migrating to OKLCH tokens.",
    environment: "Internal DS v3, Tailwind 4, OKLCH tokens",
    fix: "Add the `.dark` selector variant to the hover token and regenerate tokens. The migration script skipped state-modifier tokens — open a PR against `tokens/generate.ts` to include them.",
    visibility: "org",
    created_by: null
  },
  {
    title: "Vault: short-lived DB credentials expiring mid-request",
    problem:
      "API requests sometimes failed with 'password authentication failed' under sustained load.",
    environment: "HashiCorp Vault, Postgres dynamic secrets",
    fix: "Set the lease TTL higher than the longest expected request, enable automatic renewal in the Vault Agent sidecar, and add a retry on connection-refused with fresh creds.",
    visibility: "org",
    created_by: null
  },
  {
    title: "AWS SSO: `aws sso login` opens stale tenant after IdP migration",
    problem:
      "After moving from Okta to Entra ID, the AWS CLI kept opening the old IdP login page.",
    environment: "AWS CLI v2, AWS IAM Identity Center",
    fix: "Delete `~/.aws/sso/cache/` and the AWS SSO entry in `~/.aws/config`, then re-run `aws configure sso` and pick the new start URL.",
    visibility: "org",
    created_by: null
  },

  // -------- team (very specific / project-bound) --------
  {
    title: "Playwright: visual regression flake on /onboarding step 2",
    problem:
      "Snapshot diff was caused by the animated checklist finishing at different times across runs.",
    environment: "Playwright 1.46, Chromium headless",
    fix: "Disable animations in the test setup with `page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' })` and wait for `data-testid=checklist-done` before screenshot.",
    visibility: "team",
    created_by: null
  },
  {
    title: "Worker: enqueue job from server action causes duplicate run",
    problem:
      "When a user double-clicked submit, two identical jobs were enqueued.",
    environment: "BullMQ, Next.js Server Actions",
    fix: "Use the action's idempotency key (request id) as the BullMQ `jobId`. Duplicate enqueues with the same jobId are no-ops.",
    visibility: "team",
    created_by: null
  },
  {
    title: "Storybook 8 fails to resolve workspace UI package",
    problem:
      "Stories from `@acme/ui` failed to load with 'Cannot find module' inside Storybook.",
    environment: "Storybook 8, pnpm workspace, Vite builder",
    fix: "Add the workspace package to `optimizeDeps.include` in `.storybook/main.ts` viteFinal, and ensure the package's `exports` map ships ESM.",
    visibility: "team",
    created_by: null
  },
  {
    title: "Inngest: 'function not found' after rename",
    problem:
      "After renaming a function, scheduled invocations kept hitting the old name and 404ing.",
    environment: "Inngest 3, Next.js",
    fix: "Keep a stub of the old function id and re-export the new one, or run `npx inngest-cli@latest deploy --prune` to remove old function registrations after the rename ships.",
    visibility: "team",
    created_by: null
  },
  {
    title: "Posthog feature flag: payload mismatch in SSR",
    problem:
      "Server-rendered pages showed the control variant while the client hydrated to the test variant.",
    environment: "PostHog JS + Node, Next.js App Router",
    fix: "Bootstrap PostHog on the server with `posthog-node`, pass `flagValues` into the client provider via a context, and call `posthog.reloadFeatureFlags()` after hydrate only when the user id is known.",
    visibility: "team",
    created_by: null
  },
  {
    title: "Onboarding form: Zod refinement runs before async username check",
    problem:
      "Form showed 'username taken' after the synchronous validation passed, causing two error toasts.",
    environment: "react-hook-form, Zod, Next.js Server Action",
    fix: "Move the uniqueness check out of Zod and into the server action's response, returning `{fieldErrors:{username:[...]}}`. Surface server errors via RHF's `setError` instead of re-running Zod.",
    visibility: "team",
    created_by: null
  },

  // a few more extra public for breadth
  {
    title: "TypeScript: 'Type instantiation is excessively deep' on Drizzle query",
    problem:
      "A complex relational query caused TS to bail with 'excessively deep and possibly infinite'.",
    environment: "Drizzle ORM, TypeScript 5.6",
    fix: "Break the query into smaller subqueries with explicit `InferSelectModel` types, or annotate the result type manually so the compiler stops trying to widen.",
    visibility: "public",
    created_by: null
  },
  {
    title: "ESLint flat config: rules from `next/core-web-vitals` not applied",
    problem:
      "After migrating to eslint.config.mjs, Next-specific rules silently stopped firing.",
    environment: "ESLint 9, Next.js 15",
    fix: "Use `@next/eslint-plugin-next` directly in flat config — the legacy `extends: 'next/core-web-vitals'` only works under `.eslintrc`. Register the plugin and copy its recommended rules.",
    visibility: "public",
    created_by: null
  },
  {
    title: "macOS: `EMFILE: too many open files` during dev server",
    problem:
      "Vite/Next dev crashed with EMFILE after a few HMR cycles in a large monorepo.",
    environment: "macOS, Node 20",
    fix: "Raise the file-descriptor limit: `ulimit -n 10240` in your shell profile, and add `fs.inotify.max_user_watches` equivalents via `launchctl limit maxfiles` on macOS.",
    visibility: "public",
    created_by: null
  },
  {
    title: "OpenAI Node SDK: streaming response cut off at ~1MB on Vercel",
    problem:
      "Long completions truncated when piped through a Next.js Edge route.",
    environment: "Vercel Edge, OpenAI Node SDK, Next.js",
    fix: "Return the SDK's `toReadableStream()` directly inside `new Response(...)` and set `headers: { 'Transfer-Encoding': 'chunked' }`. Avoid buffering with `await response.text()` anywhere upstream.",
    visibility: "public",
    created_by: null
  }
];

const personalInsights = personalUserId
  ? [
      {
        title: "Local dev: port 3000 already in use",
        problem: "next dev failed with EADDRINUSE on 3000 after a crashed process.",
        environment: "macOS, Next.js dev server",
        fix: "Run `lsof -i :3000`, kill the stale PID, or start with `next dev -p 3001`.",
        visibility: "private",
        created_by: personalUserId
      },
      {
        title: "Draft: Cursor transcript export path",
        problem: "Wanted a stable path for `agent-insights publish` from Cursor exports.",
        environment: "Cursor, macOS",
        fix: "Point the CLI at the exported JSONL path from agent transcripts; confirm file is redacted before publish.",
        visibility: "private",
        created_by: personalUserId
      },
      {
        title: "Personal Vim setup: LSP stops attaching after Neovim 0.10",
        problem: "tsserver attached on first buffer only; subsequent buffers had no diagnostics.",
        environment: "Neovim 0.10, lspconfig",
        fix: "Pin `typescript-tools.nvim` instead of vanilla tsserver, and ensure `single_file_support = true` is off when working in workspaces.",
        visibility: "private",
        created_by: personalUserId
      },
      {
        title: "Team: in-repo lint preset rejects optional chaining in tests",
        problem: "Our shared eslint preset disallowed `?.` inside test files, but it's idiomatic.",
        environment: "Custom eslint preset, Jest",
        fix: "Override `no-unsafe-optional-chaining` and `@typescript-eslint/no-non-null-assertion` for `**/*.test.ts` in the preset.",
        visibility: "team",
        created_by: personalUserId
      },
      {
        title: "Org tip: faster CI by caching pnpm store between matrix jobs",
        problem: "Each matrix job re-downloaded pnpm packages, adding ~90s per job.",
        environment: "GitHub Actions, pnpm 9",
        fix: "Cache `~/.local/share/pnpm/store` keyed on the pnpm-lock hash. Restore in a setup step before `pnpm install --frozen-lockfile`.",
        visibility: "org",
        created_by: personalUserId
      },
      {
        title: "Published: hybrid search ranking tweak from my session",
        problem: "Empty search ranked all rows at zero; wanted recent-first for browse mode.",
        environment: "Postgres ts_rank_cd, Next.js",
        fix: "Order by `rank desc, created_at desc`; treat empty query as browse (rank 0 for all rows).",
        visibility: "public",
        created_by: personalUserId
      }
    ]
  : [];

async function main() {
  const { data: insertedCommunity, error: communityError } = await supabase
    .from("insights")
    .insert(communityInsights)
    .select("id,visibility");

  if (communityError) {
    console.error("Community seed failed:", communityError.message);
    process.exit(1);
  }

  const counts = (insertedCommunity ?? []).reduce(
    (acc, row) => {
      acc[row.visibility] = (acc[row.visibility] ?? 0) + 1;
      return acc;
    },
    /** @type {Record<string, number>} */ ({})
  );

  const summary = ["public", "org", "team"]
    .map((v) => `${v}: ${counts[v] ?? 0}`)
    .join(", ");
  console.log(`Inserted ${insertedCommunity?.length ?? 0} community insights (${summary}).`);

  if (!personalUserId) {
    console.log(
      "Skipped personal insights. Set SEED_PERSONAL_USER_ID in .env (Supabase → Authentication → Users) to seed private + your owned-public rows."
    );
    return;
  }

  const { data: insertedPersonal, error: personalError } = await supabase
    .from("insights")
    .insert(personalInsights)
    .select("id,visibility");

  if (personalError) {
    console.error("Personal seed failed:", personalError.message);
    process.exit(1);
  }

  const personalCounts = (insertedPersonal ?? []).reduce(
    (acc, row) => {
      acc[row.visibility] = (acc[row.visibility] ?? 0) + 1;
      return acc;
    },
    /** @type {Record<string, number>} */ ({})
  );
  const personalSummary = ["private", "team", "org", "public"]
    .map((v) => `${v}: ${personalCounts[v] ?? 0}`)
    .join(", ");
  console.log(
    `Inserted ${insertedPersonal?.length ?? 0} personal insights for ${personalUserId} (${personalSummary}).`
  );
}

await main();
