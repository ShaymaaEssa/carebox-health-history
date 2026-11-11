import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyMessage } from "@/lib/errors";
import { useAuth } from "@/lib/auth";

type RecoveryStatus = "checking" | "ready" | "invalid";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — CareBox" },
      { name: "description", content: "Choose a new password for your CareBox account." },
      { property: "og:title", content: "Reset password — CareBox" },
      { property: "og:description", content: "Choose a new password for your CareBox account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const { passwordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<RecoveryStatus>("checking");

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const authError =
      hashParams.has("error") ||
      queryParams.has("error") ||
      hashParams.has("error_code") ||
      queryParams.has("error_code");
    const isRecoveryLink =
      hashParams.get("type") === "recovery" || queryParams.get("type") === "recovery";

    if (authError) {
      setStatus("invalid");
      return;
    }
    if (passwordRecovery) {
      setStatus("ready");
      return;
    }
    if (!isRecoveryLink) {
      setStatus("invalid");
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => setStatus("invalid"), 5000);
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        window.clearTimeout(timeout);
        setStatus("ready");
      }
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [passwordRecovery]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      const text = "Use a password with at least 6 characters.";
      setMessage(text);
      toast.error(text);
      return;
    }
    if (password !== confirm) {
      const text = "Those passwords don't match.";
      setMessage(text);
      toast.error(text);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const errorText = error.message.toLowerCase();
        if (errorText.includes("expired") || errorText.includes("invalid") || errorText.includes("recovery")) {
          setStatus("invalid");
          return;
        }
        throw error;
      }
      toast.success("Password updated");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      const text = friendlyMessage(
        error,
        "We couldn't update your password. Please try again.",
      );
      setMessage(text);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  function requestNewLink() {
    navigate({ to: "/auth", search: { reason: "", mode: "forgot" } });
  }

  return (
    <div className="brand-texture flex min-h-screen items-center justify-center bg-brand-deep px-4 py-10">
      <div className="surface-card animate-rise-in w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          {status === "invalid" ? (
            <>
              <h1 className="text-page-title text-foreground">This link can’t be used</h1>
              <p className="text-body text-muted-foreground">
                The password reset link is invalid or has expired. Request a new link to continue.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-page-title text-foreground">
                {status === "checking" ? "Checking your link…" : "Choose a new password"}
              </h1>
              <p className="text-body text-muted-foreground">
                {status === "checking"
                  ? "Please wait while we verify your password reset link."
                  : "Pick something at least 6 characters long that you'll remember."}
              </p>
            </>
          )}
        </div>

        {status === "invalid" ? (
          <Button type="button" className="h-12 w-full" onClick={requestNewLink}>
            <Mail className="mr-2 h-4 w-4" />
            Request a new link
          </Button>
        ) : status === "ready" ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 w-full"
              value={password}
              disabled={busy}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-12 w-full"
              value={confirm}
              disabled={busy}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {message && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
          )}

          <Button type="submit" className="h-12 w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
        ) : (
          <div className="flex justify-center py-2" aria-label="Checking link">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
