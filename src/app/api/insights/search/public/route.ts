import { NextResponse } from "next/server";
import { queryEmbeddingForSearch } from "@/lib/embeddings";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const VIS = new Set(["private", "team", "org", "public"]);

/**
 * Public catalog search: only returns insights visible on the global catalog
 * (same rows as an anonymous caller would get from `search_insights` with no user id).
 * No authentication required.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "15", 10);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 15, 1), 50);

  const visParam = url.searchParams.get("visibility");
  const filter_visibilities =
    visParam && visParam !== "all"
      ? visParam
          .split(",")
          .map((v) => v.trim().toLowerCase())
          .filter((v): v is "private" | "team" | "org" | "public" => VIS.has(v))
      : null;

  const query_embedding = await queryEmbeddingForSearch(q);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("search_insights", {
    search_query: q,
    result_limit: limit,
    search_scope: "global",
    requesting_user_id: null,
    filter_visibilities:
      filter_visibilities && filter_visibilities.length > 0 ? filter_visibilities : null,
    query_embedding
  } as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
