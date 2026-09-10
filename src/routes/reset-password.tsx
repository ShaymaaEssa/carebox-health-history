import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyMessage } from "@/lib/errors";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — CareBox" },
      { name: "description", content: "Choose a new password for your CareBox account." },
      { property: "og:title", content: "Reset password — CareBox" },
      { property: "og:description", content: "Choose a new password for your CareBox account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      const text = "Those passwords don't match.";
      setMessage(text);
      toast.error(text);
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      const text = friendlyMessage(
        error,
        "We couldn't update your password. Try requesting a new reset link.",
      );
      setMessage(text);
      toast.error(text);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="brand-texture flex min-h-screen items-center justify-center bg-brand-deep px-4 py-10">
      <div className="surface-card animate-rise-in w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="text-page-title text-foreground">Choose a new password</h1>
          <p className="text-body text-muted-foreground">
            Pick something at least 6 characters long that you'll remember.
          </p>
        </div>

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
      </div>
    </div>
  );
}
