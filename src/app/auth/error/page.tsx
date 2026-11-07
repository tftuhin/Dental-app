import Link from "next/link";
import { AlertCircle } from "lucide-react";

// Where sign-in problems land (configured as `pages.error` in src/auth.ts).

const MESSAGES: Record<string, string> = {
  Configuration: "Sign-in is not set up on this server yet. Ask the administrator to set AUTH_SECRET.",
  AccessDenied: "This account is not allowed to sign in.",
  Verification: "The sign-in link has expired or was already used.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = (error && MESSAGES[error]) || "Something went wrong while signing in. Please try again.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <h1 className="text-base font-semibold">Couldn&apos;t sign you in</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Link
          href="/auth/login"
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
