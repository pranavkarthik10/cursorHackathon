"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeCliCallbackUrl } from "@/lib/safe-cli-callback";

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
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">CLI sign-in</h1>
        <p className="text-sm text-muted-foreground">
          Start from the terminal with <code className="rounded bg-muted px-1 py-0.5">agent-insights auth login</code>.
        </p>
      </main>
    );
  }

  if (!callbackUrl) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">Invalid callback</h1>
        <p className="text-sm text-muted-foreground">
          The CLI callback URL must use <code className="rounded bg-muted px-1 py-0.5">http://127.0.0.1</code> or{" "}
          <code className="rounded bg-muted px-1 py-0.5">http://localhost</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Connect the CLI</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in with the same account you use in the browser, then send your session to the local CLI listener.
        </p>
      </div>

      {authPhase === "loading" ? (
        <p className="text-sm text-muted-foreground">Checking session…</p>
      ) : authPhase === "anonymous" ? (
        <Button asChild className="w-full">
          <Link href={`/login?next=${encodeURIComponent(loginReturnPath)}`}>Sign in</Link>
        </Button>
      ) : (
        <Button className="w-full" type="button" onClick={() => void sendTokenToCli()}>
          Send token to CLI
        </Button>
      )}

      {status ? (
        <p className="text-sm leading-relaxed text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </main>
  );
}
