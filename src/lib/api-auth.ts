import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function requireBearerUser(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return { error: "Missing bearer token", status: 401 as const };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: "Invalid bearer token", status: 401 as const };
  }

  return { user: data.user };
}

