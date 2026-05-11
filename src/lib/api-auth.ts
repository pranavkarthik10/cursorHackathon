import { createSupabaseAdminClient } from "@/lib/supabase/server";

type BearerError = {
  error: string;
  status: 401;
  debug?: string;
  hint?: string;
};

type BearerOk = { user: { id: string; email?: string | null } };

export async function requireBearerUser(
  request: Request
): Promise<BearerOk | BearerError> {
  const header = request.headers.get("authorization");
  const raw = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = raw?.trim();

  if (!token) {
    return {
      error: "Missing bearer token",
      status: 401,
      hint: "Run `agent-insights auth login`, set AGENT_INSIGHTS_ACCESS_TOKEN, or pass --token."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: "Invalid bearer token",
      status: 401,
      hint:
        "Supabase access tokens expire (often within an hour). Run `agent-insights auth login` again, or set a fresh AGENT_INSIGHTS_ACCESS_TOKEN.",
      debug:
        process.env.NODE_ENV === "development"
          ? (error?.message ??
            "getUser returned no user. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are for the same Supabase project that issued the CLI token.")
          : undefined
    };
  }

  return { user: data.user };
}

