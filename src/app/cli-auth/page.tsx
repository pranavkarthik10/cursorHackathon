import { Suspense } from "react";
import { CliAuthClient } from "./cli-auth-client";

export default function CliAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-background px-6">
          <p className="font-mono text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <CliAuthClient />
    </Suspense>
  );
}
