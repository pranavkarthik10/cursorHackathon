import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "./ui";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80";

export default function LoginPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <main className="relative isolate min-h-svh">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-25"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-svh flex-col px-5 py-8 md:flex-row md:items-stretch md:px-0 md:py-0">
          <div className="mb-10 flex flex-1 flex-col md:mb-0 md:max-w-md md:flex-none md:border-r md:border-border md:px-10 md:py-12 lg:px-14">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={16} aria-hidden />
              Back
            </Link>
            <div className="mt-16 hidden md:mt-auto md:block md:pb-4">
              <p className="text-sm font-semibold tracking-tight">Coding Agent Insights</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Distilled fixes from agent sessions — publish, then search when the bug returns.
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center md:px-12 lg:px-20">
            <div className="mx-auto w-full max-w-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Access</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Sign in</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Magic link to your workspace. Same session works for dashboard and API bearer calls.
              </p>
              <AuthForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
