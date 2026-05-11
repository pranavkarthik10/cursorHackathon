import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AuthForm } from "./ui";
import { safeRedirectPath } from "@/lib/safe-redirect-path";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const postLoginPath = safeRedirectPath(next);

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

      <main className="relative flex flex-1 flex-col items-center px-6 py-12 md:py-20">
        <div className="pointer-events-none absolute inset-0 app-surface-glow" aria-hidden />
        <div className="pointer-events-none absolute inset-0 app-surface-dots" aria-hidden />

        <Link
          href="/"
          className="relative z-10 mb-10 inline-flex items-center gap-2 font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to home
        </Link>

        <div className="relative z-10 w-full max-w-md">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-primary">// access</p>
          <h1 className="font-mono text-2xl font-medium tracking-tight text-foreground">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We&apos;ll email you a magic link. The same session powers the workspace and API requests.
          </p>

          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <AuthForm postLoginPath={postLoginPath} />
          </div>
        </div>
      </main>
    </div>
  );
}
