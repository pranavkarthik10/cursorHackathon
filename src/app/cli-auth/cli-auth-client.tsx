"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeCliCallbackUrl } from "@/lib/safe-cli-callback";

function CliShell({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1100px] items-center justify-between px-7">
          <Link
            href="/"
            className="font-mono text-lg font-medium tracking-tight text-primary"
          >
            agent-insights
          </Link>
          <Link
            href="/"
            className="hidden items-center gap-1.5 font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            home <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col justify-center px-6 py-16">
        <div className="pointer-events-none absolute inset-0 app-surface-glow" aria-hidden />
        <div className="pointer-events-none absolute inset-0 app-surface-dots" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-md">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
          <h1 className="font-mono text-2xl font-medium tracking-tight text-foreground">{title}</h1>
          <div className="mt-8 rounded-lg border border-border bg-card p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function CliAuthClient() {
  const searchParams = useSearchParams();
  const callbackRaw = searchParams.get("callback");
  const state = searchParams.get("state");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const callbackUrl = useMemo(() => safeCliCallbackUrl(callbackRaw), [callbackRaw]);

  const [status, setStatus] = useState<string>("");
  const [authPhase, setAuthPhase] = useState<"loading" | "anonymous" | "signedIn">("loading");

  const loginReturnPath = useMemo(() => {
    if (!callbackRaw || !state) return "/login";
    const qs = new URLSearchParams({ callback: callbackRaw, state });
    return `/cli-auth?${qs.toString()}`;
  }, [callbackRaw, state]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setAuthPhase(data.session?.access_token ? "signedIn" : "anonymous");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase.auth]);

  async function sendTokenToCli() {
    if (!callbackUrl || !state) {
      setStatus("Missing callback or state.");
      return;
    }

    setStatus("Sending credentials to the CLI…");

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      setStatus(error?.message ?? "No active session. Sign in first.");
      return;
    }

    try {
      const res = await fetch(callbackUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: session.access_token,
          state
        })
      });

      if (!res.ok) {
        const text = await res.text();
        setStatus(text || `CLI handshake failed (${res.status}).`);
        return;
      }

      setStatus("Done. You can close this tab and return to the terminal.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus(`Could not reach the CLI listener: ${message}`);
    }
  }

  if (!callbackRaw || !state) {
    return (
      <CliShell title="CLI sign-in" eyebrow="// cli">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Start from the terminal with{" "}
          <code className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-foreground">
            agent-insights auth login
          </code>
          .
        </p>
      </CliShell>
    );
  }

  if (!callbackUrl) {
    return (
      <CliShell title="Invalid callback" eyebrow="// cli">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The CLI callback URL must use{" "}
          <code className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-foreground">
            http://127.0.0.1
          </code>{" "}
          or{" "}
          <code className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-foreground">
            http://localhost
          </code>
          .
        </p>
      </CliShell>
    );
  }

  return (
    <CliShell title="Connect the CLI" eyebrow="// cli">
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in with the same account you use in the browser, then send your session to the local CLI listener.
        </p>

        {authPhase === "loading" ? (
          <p className="text-sm text-muted-foreground">Checking session…</p>
        ) : authPhase === "anonymous" ? (
          <Button asChild className="h-11 w-full font-mono text-[13px] font-medium shadow-none">
            <Link href={`/login?next=${encodeURIComponent(loginReturnPath)}`}>Sign in</Link>
          </Button>
        ) : (
          <Button
            className="h-11 w-full font-mono text-[13px] font-medium shadow-none"
            type="button"
            onClick={() => void sendTokenToCli()}
          >
            Send token to CLI
          </Button>
        )}

        {status ? (
          <p className="text-sm leading-relaxed text-muted-foreground" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </CliShell>
  );
}
