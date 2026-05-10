import Link from "next/link";
import { ArrowRight, Database, KeyRound, Search, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./workspace";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    return <DashboardClient email={user.email ?? "signed in"} />;
  }

  return (
    <main className="min-h-svh">
      <section className="mx-auto grid min-h-svh max-w-6xl content-center gap-12 px-6 py-16 md:grid-cols-[1fr_0.9fr] md:px-10">
        <div className="flex flex-col justify-center">
          <Badge className="mb-5 w-fit">agent-native knowledge base</Badge>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-normal text-foreground md:text-7xl">
            Coding Agent Insights
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Publish the reusable lesson from a solved agent session, then retrieve it when the same strange issue shows up again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Sign in <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#api">View backend shape</a>
            </Button>
          </div>
        </div>

        <div className="grid content-center gap-3 border-l border-border pl-6">
          {[
            ["CLI auth", "Users sign in once; the CLI stores a user token.", KeyRound],
            ["Publish API", "Server extracts and stores the tiny insight card.", Terminal],
            ["Supabase", "Postgres owns insights, auth, and search.", Database],
            ["Search API", "Agents retrieve fixes through a bearer-token request.", Search]
          ].map(([title, body, Icon]) => (
            <div key={title as string} className="grid grid-cols-[2rem_1fr] gap-4 py-4">
              <Icon className="mt-1 text-primary" size={20} />
              <div>
                <h2 className="font-medium">{title as string}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{body as string}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="api" className="border-t border-border px-6 py-10 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-sm text-muted-foreground">
            CLI calls: POST /api/insights/publish and GET /api/insights/search?q=... with Authorization: Bearer &lt;supabase access token&gt;
          </p>
        </div>
      </section>
    </main>
  );
}

async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
