import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { HeartPulse, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { friendlyMessage } from "@/lib/errors";

const searchSchema = z.object({ reason: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Sign in — CareBox" },
      { name: "description", content: "Sign in to CareBox to view your family's prescription history." },
      { property: "og:title", content: "Sign in — CareBox" },
      { property: "og:description", content: "Sign in to CareBox to view your family's prescription history." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function friendlyAuthMessage(error: unknown) {
  const raw = error instanceof Error ? error.message.toLowerCase() : "";
  if (raw.includes("invalid login credentials")) return "That email and password don't match.";
  if (raw.includes("already registered")) return "That email already has an account — try signing in.";
  if (raw.includes("email not confirmed")) return "Please confirm your email address first.";
  if (raw.includes("password")) return "Please use a password with at least 6 characters.";
  return friendlyMessage(error, "We couldn't complete that. Please try again.");
}

function AuthPage() {
  const navigate = useNavigate();
  const { reason } = Route.useSearch();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    reason === "expired" ? "Your session expired — please sign in again to continue." : null,
  );

  useEffect(() => {
    if (reason !== "expired") {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) navigate({ to: "/dashboard", replace: true });
      });
    }
  }, [navigate, reason]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("Check your inbox for a password reset link.");
        toast.success("Reset link sent");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          navigate({ to: "/dashboard", replace: true });
        } else {
          setMessage("Almost there — confirm your email address to finish signing up.");
          toast.success("Confirmation email sent");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      const friendly = friendlyAuthMessage(error);
      setErrorMessage(friendly);
      toast.error(friendly);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    setErrorMessage(null);
    setGoogleBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setGoogleBusy(false);
      setErrorMessage("Google sign-in isn't available right now.");
      toast.error("Google sign-in isn't available right now.");
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between bg-primary px-12 py-14 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground/15">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">CareBox</span>
        </div>
        <div className="max-w-md space-y-4">
          <p className="font-display text-4xl leading-tight font-semibold tracking-tight">
            Every prescription, for everyone you care for.
          </p>
          <p className="text-primary-foreground/80 text-base leading-relaxed">
            Photograph a prescription once and keep the whole family's history in one calm,
            private place.
          </p>
        </div>
        <p className="text-primary-foreground/60 text-xs">Private by design · Only you can see your records</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
        <div className="animate-rise-in w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <HeartPulse className="h-6 w-6" />
            </span>
            <h1 className="text-page-title text-foreground">CareBox</h1>
            <p className="text-meta mt-2">Your family's prescription history, kept safe and private.</p>
          </div>

          <Card className="surface-card border-0 shadow-none sm:border sm:shadow-[var(--shadow-card)]">
            <CardContent className="space-y-5 p-0 sm:p-6">
              <div className="hidden lg:block">
                <h2 className="text-section-title text-foreground">
                  {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}
                </h2>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full"
                onClick={handleGoogle}
                disabled={googleBusy || busy}
              >
                {googleBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {googleBusy ? "Opening Google…" : "Continue with Google"}
              </Button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-eyebrow">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      className="h-12"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      disabled={busy}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={busy}
                  />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      className="h-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      disabled={busy}
                    />
                  </div>
                )}

                {message && <p className="text-meta">{message}</p>}
                {errorMessage && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}

                <Button type="submit" className="h-12 w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {busy
                    ? mode === "forgot"
                      ? "Sending…"
                      : mode === "signup"
                        ? "Creating account…"
                        : "Signing in…"
                    : mode === "signup"
                      ? "Create account"
                      : mode === "forgot"
                        ? "Send reset link"
                        : "Sign in"}
                </Button>
              </form>

              <div className="space-y-2 text-center text-sm">
                {mode === "signin" && (
                  <>
                    <button
                      type="button"
                      className="min-h-9 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot your password?
                    </button>
                    <p className="text-muted-foreground">
                      New here?{" "}
                      <button
                        type="button"
                        className="min-h-9 font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => setMode("signup")}
                      >
                        Create an account
                      </button>
                    </p>
                  </>
                )}
                {mode !== "signin" && (
                  <button
                    type="button"
                    className="min-h-9 font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
