import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies. Route handlers can.
          }
        }
      }
    }
  );
}

let adminClient: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdminClient() {
  if (!adminClient) {
    const url = requireSupabaseProjectUrl();
    adminClient = createClient(
      url,
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return adminClient;
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

/** Same HTTPS project URL as in the Supabase dashboard (Settings → API → Project URL). */
function requireSupabaseProjectUrl() {
  const raw =
    process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL to your project URL, e.g. https://abcd1234.supabase.co"
    );
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("not http(s)");
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      `Invalid SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL: "${raw.slice(0, 48)}${raw.length > 48 ? "…" : ""}". Use the HTTPS Project URL (not the postgres connection string).`
    );
  }
}
