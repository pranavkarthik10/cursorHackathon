import { AuthForm } from "./ui";

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use email magic link auth for the dashboard and CLI token flow.
        </p>
        <AuthForm />
      </div>
    </main>
  );
}

