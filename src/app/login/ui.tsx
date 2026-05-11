"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ postLoginPath = "/" }: { postLoginPath?: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function signIn() {
    setStatus("Sending magic link...");
    const safeNext = postLoginPath.startsWith("/") ? postLoginPath : "/";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
      }
    });

    setStatus(error ? error.message : "Check your email for the sign-in link.");
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void signIn();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-11 border-border bg-secondary/80 shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-primary"
        />
      </div>
      <Button
        className="h-11 w-full font-mono text-[13px] font-medium shadow-none"
        type="submit"
        disabled={!email.trim()}
      >
        Send magic link
      </Button>
      {status ? (
        <p className="text-sm leading-relaxed text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </form>
  );
}
