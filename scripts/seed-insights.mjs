/**
 * Seeds mock insights: community (public + team) and optional personal rows
 * for the authenticated user id in SEED_PERSONAL_USER_ID.
 *
 * Apply schema first: `npm run db:init` (needs DATABASE_URL) or paste `supabase/schema.sql` in the SQL Editor.
 *
 * Run from repo root:
 *   npm run seed:insights
 *
 * Get your user UUID from Supabase → Authentication → Users, or from the JWT `sub`.
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

const communityInsights = [
  {
    title: "Next.js 15: Dynamic route params undefined on first render in client component",
    problem:
      "useParams() in a client component returned undefined for slug on the first paint, then populated — caused hydration warnings and a flash of empty state.",
    environment: "Next.js 15, App Router, React 19, Vercel",
    fix:
      "Read params from the server page (async page.tsx) and pass them as props, or use useParams inside useEffect for client-only reads. Avoid using param values synchronously in the first client render without a loading boundary.",
    visibility: "public",
    created_by: null
  },
  {
    title: "pnpm: workspace package not resolved — ERR_PNPM_WORKSPACE_PKG_NOT_FOUND",
    problem:
      "Importing an internal workspace package failed in CI with ERR_PNPM_WORKSPACE_PKG_NOT_FOUND even though the package existed locally.",
    environment: "pnpm 9, monorepo with packages/*",
    fix:
      "Ensure the dependency in package.json uses `workspace:*` (or correct protocol), run `pnpm install` from the repo root, and that `pnpm-workspace.yaml` globs include the package path. Verify the consumed package name matches the `name` field in its package.json exactly.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Supabase RLS: RPC returns empty rows while table has data",
    problem:
      "search_insights RPC returned no rows in the app but identical SQL in the SQL editor with service role showed rows.",
    environment: "Supabase Postgres, Next.js API route with user JWT",
    fix:
      "Check that the RPC runs as the invoker and RLS policies allow SELECT for that role. For admin-only operations, use the service role client on the server only, never in the browser. Confirm `requesting_user_id` and scope match your filter logic.",
    visibility: "public",
    created_by: null
  },
  {
    title: "Tailwind v4 + PostCSS: @tailwind directives ignored",
    problem:
      "After upgrading to Tailwind 4, styles did not apply; build succeeded but utilities were missing.",
    environment: "Tailwind CSS 4, @tailwindcss/postcss, Next.js 16",
    fix:
      "Use `@import \"tailwindcss\"` in your CSS entry instead of `@tailwind base/components/utilities`, and ensure postcss.config uses `@tailwindcss/postcss`. Remove conflicting old PostCSS plugins that process Tailwind twice.",
    visibility: "team",
    created_by: null
  },
  {
    title: "OpenAI embedding dimension mismatch with pgvector column",
    problem:
      "Insert failed: expected 1536 dimensions but vector had a different length when switching embedding models.",
    environment: "Supabase pgvector, text-embedding-3-small vs ada-002",
    fix:
      "Align the `vector(N)` column size with the model output (e.g. 1536 for text-embedding-3-small). Either migrate the column dimension or always use one model. Regenerate embeddings after any model change.",
    visibility: "team",
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
        problem: "Needed a stable path for agent-insights publish from Cursor exports.",
        environment: "Cursor, macOS",
        fix: "Point the CLI at the exported JSONL path from agent transcripts; confirm file is redacted before publish.",
        visibility: "private",
        created_by: personalUserId
      },
      {
        title: "Published from my session: hybrid search ranking tweak",
        problem: "Empty search query ranked all rows at zero; wanted recent-first for browse mode.",
        environment: "Postgres ts_rank_cd, Next.js",
        fix: "Order by rank desc, then created_at desc; treat empty query as browse (rank 0 for all).",
        visibility: "public",
        created_by: personalUserId
      }
    ]
  : [];

async function main() {
  const { data: insertedCommunity, error: communityError } = await supabase
    .from("insights")
    .insert(communityInsights)
    .select("id,title,visibility");

  if (communityError) {
    console.error("Community seed failed:", communityError.message);
    process.exit(1);
  }

  console.log(`Inserted ${insertedCommunity?.length ?? 0} community insights (public + team).`);

  if (!personalUserId) {
    console.log(
      "Skipped personal insights (set SEED_PERSONAL_USER_ID to your auth.users id to seed private + your public rows)."
    );
    return;
  }

  const { data: insertedPersonal, error: personalError } = await supabase
    .from("insights")
    .insert(personalInsights)
    .select("id,title,visibility");

  if (personalError) {
    console.error("Personal seed failed:", personalError.message);
    process.exit(1);
  }

  console.log(`Inserted ${insertedPersonal?.length ?? 0} personal insights for user ${personalUserId}.`);
}

await main();
