import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

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
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div>
      <PageHeader title="Account" backTo="/dashboard" />
      <Card className="mb-4">
        <CardContent className="space-y-1 p-4 text-sm">
          <p className="font-medium text-foreground">{profile.data?.full_name || "Your account"}</p>
          <p className="text-muted-foreground">{user?.email}</p>
        </CardContent>
      </Card>

      <Button variant="outline" className="h-12 w-full" onClick={handleSignOut}>
        Sign out
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">
        Need to delete your account?{" "}
        <a className="text-primary underline-offset-4 hover:underline" href="mailto:support@carebox.app">
          Contact support
        </a>{" "}
        and we'll remove your data.
      </p>
    </div>
  );
}
