/**
 * Applies supabase/schema.sql to your Supabase Postgres database.
 *
 * Prereqs:
 * 1. Enable the "vector" extension: Supabase Dashboard → Database → Extensions → vector.
 * 2. Set DATABASE_URL to the direct connection string (recommended for DDL):
 *    Dashboard → Project Settings → Database → Connection string → URI (use port 5432).
 *
 * Run:
 *   npm run db:init
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "supabase", "schema.sql");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL. Copy the Postgres URI from Supabase → Settings → Database (direct connection, port 5432)."
  );
  process.exit(1);
}

const ddl = readFileSync(schemaPath, "utf8");

const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql.unsafe(ddl);
  console.log(`Applied ${schemaPath}`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("db:init failed:", msg);
  if (/extension "vector"/i.test(msg)) {
    console.error(
      'Hint: enable pgvector in the dashboard (Database → Extensions → "vector"), then run npm run db:init again.'
    );
  }
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
