import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { familyMemberQuery, memberPrescriptionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/family/$memberId")({
  head: () => ({
    meta: [
      { title: "Family member — CareBox" },
      { name: "description", content: "Prescription history for this family member in CareBox." },
      { property: "og:title", content: "Family member — CareBox" },
      { property: "og:description", content: "Prescription history for this family member in CareBox." },
    ],
  }),
  component: MemberDetail,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MemberDetail() {
  const { memberId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const member = useQuery(familyMemberQuery(memberId));
  const prescriptions = useQuery(memberPrescriptionsQuery(memberId));
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    const { error } = await supabase.from("family_members").delete().eq("id", memberId);
    if (error) {
      toast.error("We couldn't delete this family member.");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Family member deleted");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div>
      <PageHeader
        title={member.data?.name ?? "Family member"}
        subtitle={
          member.data
            ? [member.data.relationship, member.data.date_of_birth ? `Born ${formatDate(member.data.date_of_birth)}` : null]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        backTo="/dashboard"
        action={
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="icon">
              <Link to="/family/$memberId/edit" params={{ memberId }} aria-label="Edit family member">
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" aria-label="Delete family member" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {member.data?.notes && (
        <Card className="mb-6">
          <CardContent className="p-4 text-sm text-muted-foreground">{member.data.notes}</CardContent>
        </Card>
      )}

      <Button asChild className="mb-5 h-12 w-full">
        <Link to="/prescriptions/new" search={{ memberId }}>
          <Plus className="mr-1 h-4 w-4" /> Add prescription
        </Link>
      </Button>

      <div className="space-y-3">
        {prescriptions.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}

        {!prescriptions.isLoading && (prescriptions.data?.length ?? 0) === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No prescriptions saved yet. Add the first one to start their history.
            </CardContent>
          </Card>
        )}

        {(prescriptions.data ?? []).map((p) => (
          <Link
            key={p.id}
            to="/prescriptions/$prescriptionId"
            params={{ prescriptionId: p.id }}
            className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-foreground">{formatDate(p.prescription_date)}</span>
              {p.attachment_count > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" /> {p.attachment_count}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-foreground">{p.doctor_name || "No doctor recorded"}</p>
            {p.specialty && <p className="text-xs text-muted-foreground">{p.specialty}</p>}
            {p.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.notes}</p>}
          </Link>
        ))}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this family member?</AlertDialogTitle>
            <AlertDialogDescription>
              This also deletes all of their prescriptions and attached files. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
