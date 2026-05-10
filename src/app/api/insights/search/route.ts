import { NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireBearerUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "5", 10);

  if (!query) {
    return NextResponse.json({ error: "Missing q search param" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("search_insights", {
    search_query: query,
    result_limit: Number.isFinite(limit) ? limit : 5
  } as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
