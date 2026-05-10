import { NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const VIS = new Set(["private", "team", "org", "public"]);

export async function GET(request: Request) {
  const auth = await requireBearerUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const scope = url.searchParams.get("scope") === "mine" ? "mine" : "global";
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "25", 10);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 25, 1), 100);

  const visParam = url.searchParams.get("visibility");
  const filter_visibilities =
    visParam && visParam !== "all"
      ? visParam
          .split(",")
          .map((v) => v.trim().toLowerCase())
          .filter((v): v is "private" | "team" | "org" | "public" => VIS.has(v))
      : null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("search_insights", {
    search_query: q,
    result_limit: limit,
    search_scope: scope,
    requesting_user_id: auth.user.id,
    filter_visibilities:
      filter_visibilities && filter_visibilities.length > 0 ? filter_visibilities : null
  } as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
