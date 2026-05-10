import { createClient } from "@supabase/supabase-js";
import { loadConfig } from "./config.js";

export function createSupabaseClient() {
  const config = loadConfig();

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

