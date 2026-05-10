import Image from "next/image";
import Link from "next/link";
import { ArrowRight, KeyRound, Search, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./workspace";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=2000&q=80";

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
    <div className="min-h-svh bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          Coding Agent Insights
        </Link>
        <Button asChild size="sm" variant="secondary" className="backdrop-blur-sm">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <main>
        <section className="relative isolate flex min-h-svh items-end md:items-center">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="hero-backdrop object-cover object-center opacity-40"
            sizes="100vw"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 md:bg-gradient-to-r md:from-background md:via-background/90 md:to-background/20"
            aria-hidden
          />
          <div className="relative z-10 w-full px-5 pb-14 pt-28 md:px-10 md:pb-24 md:pt-32">
            <div className="mx-auto max-w-xl">
              <p className="hero-animate hero-animate-delay-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Agent-native
              </p>
              <h1 className="hero-animate hero-animate-delay-2 mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl md:leading-[1.02]">
                Coding Agent Insights
              </h1>
              <p className="hero-animate hero-animate-delay-3 mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                Publish the fix from a solved session. Search it when the same error comes back.
              </p>
              <div className="hero-animate hero-animate-delay-4 mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/login">
                    Start <ArrowRight size={16} aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-foreground/20 bg-background/40 backdrop-blur-sm">
                  <a href="#flow">How it works</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="flow" className="border-t border-border px-5 py-20 md:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Flow</h2>
            <p className="mt-3 max-w-xl text-2xl font-medium leading-snug tracking-tight">
              Auth once, publish distilled cards, query with a bearer token from agents or the UI.
            </p>
            <ul className="mt-12 divide-y divide-border">
              {[
                { title: "User auth", body: "Sign in for the dashboard and CLI token flow.", icon: KeyRound },
                { title: "Publish API", body: "Server extracts and stores the tiny insight card.", icon: Terminal },
                { title: "Search API", body: "Retrieve fixes with Authorization: Bearer.", icon: Search }
              ].map(({ title, body, icon: Icon }) => (
                <li key={title} className="flex gap-5 py-6 first:pt-0">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border px-5 py-16 md:px-10">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">API</h2>
              <p className="mt-3 max-w-md text-lg font-medium leading-snug">
                POST /api/insights/publish and GET /api/insights/search?q=…
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Send your Supabase access token in the Authorization header.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/login">Open workspace</Link>
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
