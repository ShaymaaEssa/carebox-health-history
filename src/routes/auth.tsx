import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  Loader2,
  Lock,
  Mail,
  Pill,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyMessage } from "@/lib/errors";

const searchSchema = z.object({
  reason: fallback(z.string(), "").default(""),
  mode: z.literal("forgot").optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Sign in — CareBox" },
      {
        name: "description",
        content: "Sign in to CareBox to view your family's prescription history.",
      },
      { property: "og:title", content: "Sign in — CareBox" },
      {
        property: "og:description",
        content: "Sign in to CareBox to view your family's prescription history.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function friendlyAuthMessage(error: unknown) {
  const raw = error instanceof Error ? error.message.toLowerCase() : "";
  if (raw.includes("invalid login credentials")) return "That email and password don't match.";
  if (raw.includes("already registered"))
    return "That email already has an account — try signing in.";
  if (raw.includes("email not confirmed")) return "Please confirm your email address first.";
  if (raw.includes("password")) return "Please use a password with at least 6 characters.";
  return friendlyMessage(error, "We couldn't complete that. Please try again.");
}

function GoogleMark() {
  return (
    <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { reason, mode: requestedMode } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(requestedMode === "forgot" ? "forgot" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    reason === "expired" ? "Your session expired — please sign in again to continue." : null,
  );

  useEffect(() => {
    if (reason !== "expired" && requestedMode !== "forgot") {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) navigate({ to: "/dashboard", replace: true });
      });
    }
  }, [navigate, reason, requestedMode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        const origin = typeof window === "undefined" ? null : window.location.origin;
        if (!origin) throw new Error("Please try again in your browser.");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/reset-password`,
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

  const headline =
    mode === "signup"
      ? "Create your family vault."
      : mode === "forgot"
        ? "Reset your password."
        : "Your family’s health history, peacefully organized.";

  const subtext =
    mode === "signup"
      ? "Set up a calm, private home for every prescription and doctor visit."
      : mode === "forgot"
        ? "Enter your account email and we'll send you a secure reset link."
        : "One private home for every prescription, doctor note, and checkup.";

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <div className="brand-texture relative hidden flex-col justify-between overflow-hidden bg-brand-deep px-12 py-14 text-primary-foreground lg:flex">
        <HeartPulse className="absolute top-[14%] right-[12%] h-14 w-14 rotate-6 opacity-[0.06]" />
        <Pill className="absolute top-[37%] left-[14%] h-11 w-11 -rotate-12 opacity-[0.07]" />
        <ShieldCheck className="absolute right-[18%] bottom-[24%] h-16 w-16 opacity-[0.06]" />
        <Sparkles className="absolute bottom-[12%] left-[9%] h-9 w-9 opacity-[0.06]" />

        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground/15">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">CareBox</span>
        </div>

        <div className="max-w-md space-y-4">
          <p className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance">
            Every prescription, for everyone you care for.
          </p>
          <p className="text-base leading-relaxed text-primary-foreground/80">
            Photograph a prescription once and keep the whole family's history in one calm, private
            place.
          </p>
        </div>

        <p className="text-xs text-primary-foreground/65">
          Private by design · Only you can see your records
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
        <div className="animate-rise-in w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="relative mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[20px] bg-card shadow-[var(--shadow-card)] ring-1 ring-border/70">
              <HeartPulse className="h-7 w-7 text-primary" />
              <span className="absolute -top-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-secondary text-primary ring-2 ring-background">
                <Lock className="h-3 w-3" />
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
              <ShieldCheck className="h-3 w-3" /> Private family vault
            </span>

            <h1 className="font-display mt-3 text-[26px] leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
              {headline}
            </h1>
            <p className="text-meta mx-auto mt-2 max-w-sm leading-relaxed">{subtext}</p>
          </div>

          <Card className="rounded-[20px] border border-border/80 bg-card shadow-[var(--shadow-card)]">
            <CardContent className="space-y-5 p-6 sm:p-7">
              {mode !== "forgot" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full cursor-pointer rounded-xl border-border/90 bg-secondary/45 font-semibold text-foreground hover:bg-secondary"
                    onClick={handleGoogle}
                    disabled={googleBusy || busy}
                  >
                    {googleBusy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleMark />
                    )}
                    {googleBusy ? "Opening Google…" : "Continue with Google"}
                  </Button>

                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground">
                      or {mode === "signup" ? "sign up" : "sign in"} with email
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        className="h-12 rounded-xl bg-muted/45 pl-10"
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        disabled={busy}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="h-12 rounded-xl bg-muted/45 pl-10"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={busy}
                    />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          className="cursor-pointer text-xs font-semibold text-primary underline-offset-4 hover:underline"
                          onClick={() => {
                            setMessage(null);
                            setErrorMessage(null);
                            setMode("forgot");
                          }}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        className="h-12 rounded-xl bg-muted/45 pr-11 pl-10"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {message && (
                  <p className="rounded-xl bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground">
                    {message}
                  </p>
                )}
                {errorMessage && (
                  <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full cursor-pointer rounded-xl font-semibold shadow-[0_6px_18px_-4px_rgba(13,94,79,0.28)]"
                  disabled={busy}
                >
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
                  {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-[20px] border border-border/70 bg-secondary/50 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card text-primary shadow-2xs">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Private by design</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Protected by row-level access controls and private storage so only you can view your
                family’s records.
              </p>
            </div>
          </div>

          <div className="text-center text-sm">
            {mode === "signin" ? (
              <div className="space-y-2.5">
                <p className="text-muted-foreground">Don’t have an account yet?</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 cursor-pointer rounded-full px-5 font-semibold text-primary"
                  onClick={() => {
                    setMessage(null);
                    setErrorMessage(null);
                    setMode("signup");
                  }}
                >
                  Create family vault
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="min-h-10 cursor-pointer font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setMessage(null);
                  setErrorMessage(null);
                  setMode("signin");
                }}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
