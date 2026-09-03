import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileHeart, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { familyMemberQuery, memberPrescriptionsQuery } from "@/lib/queries";
import { useActionError } from "@/lib/use-action-error";

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
  const reportError = useActionError();
  const member = useQuery(familyMemberQuery(memberId));
  const prescriptions = useQuery(memberPrescriptionsQuery(memberId));
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    const { error } = await supabase.from("family_members").delete().eq("id", memberId);
    if (error) {
      reportError(error, {
        fallback: "We couldn't delete this family member. Please try again.",
        retry: handleDelete,
      });
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Family member deleted");
    navigate({ to: "/dashboard", replace: true });
  }

  const list = prescriptions.data ?? [];

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
            <Button asChild variant="outline" size="icon" className="h-11 w-11">
              <Link to="/family/$memberId/edit" params={{ memberId }} aria-label="Edit family member">
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 text-destructive hover:text-destructive"
              aria-label="Delete family member"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          {member.data?.notes && (
            <div className="surface-card text-body p-4 text-muted-foreground">{member.data.notes}</div>
          )}
          <Button asChild className="h-12 w-full">
            <Link to="/prescriptions/new" search={{ memberId }}>
              <Plus className="mr-1 h-4 w-4" /> Add prescription
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          {prescriptions.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}

          {!prescriptions.isLoading && list.length === 0 && (
            <EmptyState
              icon={FileHeart}
              title="No prescriptions yet"
              description={`Save ${member.data?.name ?? "their"} first prescription — snap a photo or attach a PDF.`}
              action={
                <Button asChild className="h-11">
                  <Link to="/prescriptions/new" search={{ memberId }}>
                    <Plus className="mr-1 h-4 w-4" /> Add prescription
                  </Link>
                </Button>
              }
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {list.map((p) => (
              <Link
                key={p.id}
                to="/prescriptions/$prescriptionId"
                params={{ prescriptionId: p.id }}
                className="card-interactive animate-fade-in block p-4 sm:p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-card-title text-foreground">{formatDate(p.prescription_date)}</span>
                  {p.attachment_count > 0 && (
                    <span className="text-meta flex shrink-0 items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" /> {p.attachment_count}
                    </span>
                  )}
                </div>
                <p className="text-body mt-1 text-foreground">{p.doctor_name || "No doctor recorded"}</p>
                {p.specialty && <p className="text-meta">{p.specialty}</p>}
                {p.notes && <p className="text-meta mt-1 line-clamp-2">{p.notes}</p>}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this family member?"
        description="This also deletes all of their prescriptions and attached files. This can't be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
