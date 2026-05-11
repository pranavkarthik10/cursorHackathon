import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBearerUser } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { embedText, hasEmbeddingProvider, insightEmbeddingText } from "@/lib/embeddings";
import { buildStructuredInsight } from "@/insight";

const visibilityEnum = z.enum(["private", "team", "org", "public"]);

const publishSchema = z.object({
  title: z.string().trim().min(1).max(500),
  problem: z.string().trim().min(1).max(12_000),
  environment: z.string().trim().max(4_000).optional().default(""),
  fix: z.string().trim().min(1).max(12_000),
  visibility: visibilityEnum.default("private")
});

export async function POST(request: Request) {
  const auth = await requireBearerUser(request);
  if ("error" in auth) {
    return NextResponse.json(
      {
        error: auth.error,
        ...(auth.hint !== undefined ? { hint: auth.hint } : {}),
        ...(auth.debug !== undefined ? { debug: auth.debug } : {})
      },
      { status: auth.status }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = publishSchema.safeParse(json);
  if (!result.success) {
    return NextResponse.json(
      { error: "Requires: title, problem, fix (environment optional). " + result.error.message },
      { status: 400 }
    );
  }

  const d = result.data;
  const insight = buildStructuredInsight({
    title: d.title,
    problem: d.problem,
    environment: d.environment ?? "",
    fix: d.fix,
    visibility: d.visibility
  });

  let embedding: number[] | null = null;
  if (hasEmbeddingProvider()) {
    try {
      embedding = await embedText(insightEmbeddingText(insight));
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not generate embedding (check OPENAI_API_KEY, or enable CLōD with CLOD_EMBEDDINGS_ENABLED=true and CLOD_API_KEY). Insight was not saved."
        },
        { status: 503 }
      );
    }
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("insights")
    .insert({
      ...insight,
      ...(embedding ? { embedding } : {}),
      created_by: auth.user.id
    } as never)
    .select("id,title,problem,environment,fix,visibility,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ insight: data });
}
