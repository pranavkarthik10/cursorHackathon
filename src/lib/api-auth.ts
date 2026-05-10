import { createSupabaseAdminClient } from "@/lib/supabase/server";

type BearerError = {
  error: string;
  status: 401;
  debug?: string;
};

type BearerOk = { user: { id: string; email?: string | null } };

export async function requireBearerUser(
  request: Request
): Promise<BearerOk | BearerError> {
  const header = request.headers.get("authorization");
  const raw = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = raw?.trim();

  if (!token) {
    return { error: "Missing bearer token", status: 401 };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: "Invalid bearer token",
      status: 401,
      debug:
        process.env.NODE_ENV === "development"
          ? (error?.message ??
            "getUser returned no user. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are for the same Supabase project that issued the CLI token.")
          : undefined
    };
  }

  return { user: data.user };
}

