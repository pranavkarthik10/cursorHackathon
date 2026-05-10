"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function signIn() {
    setStatus("Sending magic link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setStatus(error ? error.message : "Check your email for the sign-in link.");
  }

  return (
    <form
      className="mt-8 space-y-4"
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
          className="h-11 bg-background/60 backdrop-blur-sm"
        />
      </div>
      <Button className="h-11 w-full" type="submit" disabled={!email.trim()}>
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
