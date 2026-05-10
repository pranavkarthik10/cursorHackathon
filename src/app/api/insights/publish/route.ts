import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBearerUser } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { extractInsight } from "@/insight";

const publishSchema = z.object({
  transcript: z.string().min(1),
  visibility: z.enum(["private", "team", "org", "public"]).default("private")
});

export async function POST(request: Request) {
  const auth = await requireBearerUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = publishSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const insight = extractInsight(parsed.data.transcript, parsed.data.visibility);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("insights")
    .insert({
      ...insight,
      created_by: auth.user.id
    } as never)
    .select("id,title,problem,environment,fix,visibility,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ insight: data });
}
