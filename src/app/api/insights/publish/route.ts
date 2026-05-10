import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBearerUser } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildStructuredInsight, extractInsight } from "@/insight";

const MAX_TRANSCRIPT_CHARS = 512_000;

const visibilityEnum = z.enum(["private", "team", "org", "public"]);

const transcriptPublishSchema = z.object({
  transcript: z.string().min(1).max(MAX_TRANSCRIPT_CHARS),
  visibility: visibilityEnum.default("private")
});

const structuredPublishSchema = z.object({
  title: z.string().trim().min(1).max(500),
  problem: z.string().trim().min(1).max(12_000),
  environment: z.string().trim().max(4_000).optional().default(""),
  fix: z.string().trim().min(1).max(12_000),
  visibility: visibilityEnum.default("private")
});

function publishMode(body: unknown): "transcript" | "structured" | "conflict" | "none" {
  if (!body || typeof body !== "object") return "none";
  const o = body as Record<string, unknown>;
  const hasTranscript =
    typeof o.transcript === "string" && o.transcript.trim().length > 0;
  const hasStructured =
    typeof o.title === "string" &&
    o.title.trim().length > 0 &&
    typeof o.problem === "string" &&
    o.problem.trim().length > 0 &&
    typeof o.fix === "string" &&
    o.fix.trim().length > 0;

  if (hasTranscript && hasStructured) return "conflict";
  if (hasTranscript) return "transcript";
  if (hasStructured) return "structured";
  return "none";
}

export async function POST(request: Request) {
  const auth = await requireBearerUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = publishMode(json);

  if (mode === "conflict") {
    return NextResponse.json(
      {
        error:
          "Send either transcript (session text) or structured fields (title, problem, fix), not both."
      },
      { status: 400 }
    );
  }

  if (mode === "none") {
    return NextResponse.json(
      {
        error:
          "Send transcript (string) or structured insight: title, problem, fix (environment optional)."
      },
      { status: 400 }
    );
  }

  let insight;

  if (mode === "transcript") {
    const result = transcriptPublishSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    insight = extractInsight(result.data.transcript, result.data.visibility);
  } else {
    const result = structuredPublishSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    const d = result.data;
    insight = buildStructuredInsight({
      title: d.title,
      problem: d.problem,
      environment: d.environment ?? "",
      fix: d.fix,
      visibility: d.visibility
    });
  }

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
