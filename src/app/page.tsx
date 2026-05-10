import Link from "next/link";
import { ArrowRight, KeyRound, Search, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./workspace";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <DashboardClient
        email={user.email ?? "signed in"}
        avatarUrl={typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined}
        displayName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined}
      />
    );
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Coding Agent Insights
          </Link>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 md:px-6 md:pb-24 md:pt-20">
          <p className="text-sm font-medium text-primary">Agent-native knowledge</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            Turn solved sessions into searchable fixes.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Publish a distilled insight after a hard agent session. Recall it when the same stack trace or error shows up again.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Open workspace
                <ArrowRight size={16} aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-border/80 bg-secondary/30 shadow-none">
              <a href="#flow">How it works</a>
            </Button>
          </div>
        </section>

        <Separator className="bg-border/60" />

        <section id="flow" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-sm font-medium text-muted-foreground">How it works</h2>
          <p className="mt-3 max-w-2xl text-2xl font-semibold leading-snug tracking-tight">
            One auth flow for the dashboard, the API, and agent tooling.
          </p>
          <ul className="mt-12 max-w-2xl space-y-0 divide-y divide-border/80 border-y border-border/80">
            {[
              { title: "Sign in", body: "Email magic link. Same session backs bearer-token API calls.", icon: KeyRound },
              { title: "Publish", body: "POST distilled cards from transcripts or notes.", icon: Terminal },
              { title: "Search", body: "GET hybrid search with your access token.", icon: Search }
            ].map(({ title, body, icon: Icon }) => (
              <li key={title} className="flex gap-4 py-6 first:pt-6">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <Separator className="bg-border/60" />

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <div className="flex flex-col gap-8 rounded-xl border border-border/80 bg-card/40 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">HTTP API</h2>
              <p className="mt-2 font-mono text-sm text-foreground">
                POST /api/insights/publish · GET /api/insights/search?q=…
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Send <span className="font-mono text-xs">Authorization: Bearer</span> with your Supabase access token.
              </p>
            </div>
            <Button asChild>
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
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
