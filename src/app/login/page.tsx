import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "./ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeRedirectPath } from "@/lib/safe-redirect-path";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const postLoginPath = safeRedirectPath(next);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to home
      </Link>

      <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-none backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-2">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Access</p>
          <CardTitle className="text-2xl font-semibold tracking-tight">Sign in</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;ll email you a magic link. The same session powers the workspace and API requests.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <AuthForm postLoginPath={postLoginPath} />
        </CardContent>
      </Card>
    </div>
  );
}
