/**
 * Backfills embeddings for any insight rows where embedding IS NULL.
 *
 * Requires CLOD_API_KEY (and CLOD_EMBEDDINGS_ENABLED=true) or OPENAI_API_KEY.
 *
 * Run from repo root:
 *   node --env-file=.env scripts/backfill-embeddings.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

// Resolve embedding provider
const EMBED_DIM = 1536;

function resolveProvider() {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return { url: "https://api.openai.com/v1/embeddings", apiKey: openaiKey, label: "OpenAI" };
  }
  const clodEnabled = ["true","1","yes"].includes(process.env.CLOD_EMBEDDINGS_ENABLED?.trim().toLowerCase() ?? "");
  const clodKey = process.env.CLOD_API_KEY?.trim();
  const clodBase = (process.env.CLOD_API_BASE_URL?.trim() || "https://api.clod.io/v1").replace(/\/+$/, "");
  if (clodEnabled && clodKey) {
    return { url: `${clodBase}/embeddings`, apiKey: clodKey, label: "CLōD" };
  }
  return null;
}

const provider = resolveProvider();
if (!provider) {
  console.error("No embedding provider. Set OPENAI_API_KEY, or set CLOD_API_KEY + CLOD_EMBEDDINGS_ENABLED=true");
  process.exit(1);
}

console.log(`Using ${provider.label} for embeddings`);

async function embed(text) {
  const model = process.env.CLOD_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
  const res = await fetch(provider.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text.trim().slice(0, 30_000), dimensions: EMBED_DIM })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${provider.label} embeddings ${res.status}: ${err.slice(0, 300)}`);
  }
  const json = await res.json();
  const emb = json.data?.[0]?.embedding;
  if (!emb || emb.length !== EMBED_DIM) throw new Error(`Expected ${EMBED_DIM} dims, got ${emb?.length ?? 0}`);
  return emb;
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Fetch all rows with null embedding
const { data: rows, error } = await supabase
  .from("insights")
  .select("id, title, problem, environment, fix")
  .is("embedding", null);

if (error) { console.error("Fetch failed:", error.message); process.exit(1); }
if (!rows?.length) { console.log("No rows with null embedding — nothing to backfill."); process.exit(0); }

console.log(`Found ${rows.length} rows to backfill`);

let ok = 0, fail = 0;
for (const row of rows) {
  const text = [row.title, row.problem, row.environment, row.fix]
    .map(s => (s ?? "").trim()).filter(Boolean).join("\n\n");
  try {
    const embedding = await embed(text);
    const { error: upErr } = await supabase
      .from("insights")
      .update({ embedding })
      .eq("id", row.id);
    if (upErr) throw new Error(upErr.message);
    console.log(`  ✓ ${row.id.slice(0, 8)}  ${row.title.slice(0, 60)}`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${row.id.slice(0, 8)}  ${e.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} updated, ${fail} failed`);
