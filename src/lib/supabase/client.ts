"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Next.js only inlines `NEXT_PUBLIC_*` for the browser when accessed as
 * **literal** `process.env.NEXT_PUBLIC_*` — dynamic keys like `process.env[name]`
 * stay undefined in the client bundle.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishable =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !publishable) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) for the browser Supabase client."
    );
  }

  return createBrowserClient(url, publishable);
}
