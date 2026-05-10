import { NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireBearerUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    user: { id: auth.user.id, email: auth.user.email ?? null }
  });
}
