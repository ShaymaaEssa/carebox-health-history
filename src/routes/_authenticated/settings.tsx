import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useActionError } from "@/lib/use-action-error";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account — CareBox" },
      { name: "description", content: "Manage your CareBox account and sign out." },
      { property: "og:title", content: "Account — CareBox" },
      { property: "og:description", content: "Manage your CareBox account and sign out." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportError = useActionError();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as { full_name: string | null; avatar_url: string | null };
    },
  });

  async function handleSignOut() {
    setBusy(true);
    try {
      await queryClient.cancelQueries();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      toast.success("Signed out");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      reportError(error, { fallback: "We couldn't sign you out. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  const name = (profile.data?.full_name || "Your account").trim();
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Account" subtitle="Your CareBox sign-in details." backTo="/dashboard" />

      <div className="surface-card animate-fade-in flex items-center gap-4 p-4 sm:p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-lg font-semibold text-primary">
          {initial}
        </span>
        <div className="min-w-0">
          {profile.isLoading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <p className="text-card-title truncate text-foreground">{name}</p>
          )}
          <p className="text-meta truncate">{user?.email}</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="mt-4 h-12 w-full sm:w-auto sm:min-w-40"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
        {busy ? "Signing out…" : "Sign out"}
      </Button>

      <p className="text-meta mt-8">
        Need to delete your account?{" "}
        <a className="text-primary underline-offset-4 hover:underline" href="mailto:support@carebox.app">
          Contact support
        </a>{" "}
        and we'll remove your data.
      </p>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out of CareBox?"
        description="You'll need to sign in again to view your family's records."
        confirmLabel="Sign out"
        busyLabel="Signing out…"
        onConfirm={handleSignOut}
      />
    </div>
  );
}
