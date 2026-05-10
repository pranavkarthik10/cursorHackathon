import { Suspense } from "react";
import { CliAuthClient } from "./cli-auth-client";

export default function CliAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-svh max-w-md items-center justify-center px-6 py-16">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <CliAuthClient />
    </Suspense>
  );
}
