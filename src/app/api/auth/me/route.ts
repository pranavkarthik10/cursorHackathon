import { NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/api-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Current user for debugging and CLI verification.
 * - With `Authorization: Bearer <access_token>` — validates JWT (CLI / agents).
 * - Without Bearer — uses the Supabase cookie session (browser while logged in).
 */
export async function GET(request: Request) {
  const header = request.headers.get("authorization");
  const hasBearer = /^Bearer\s+\S+/i.test(header?.trim() ?? "");

  if (hasBearer) {
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

    return NextResponse.json({
      user: { id: auth.user.id, email: auth.user.email ?? null },
      via: "bearer" as const
    });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          hint:
            "Open this URL in the same browser where you are signed in, or call with Authorization: Bearer <access_token> (from `agent-insights auth login`).",
          ...(process.env.NODE_ENV === "development" && error?.message
            ? { debug: error.message }
            : {})
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email ?? null },
      via: "cookie" as const
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Session check failed",
        ...(process.env.NODE_ENV === "development" ? { debug: message } : {})
      },
      { status: 500 }
    );
  }
}
