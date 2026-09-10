import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileText, ImageOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deletePrescriptionWithFiles, isImage, signedUrl } from "@/lib/attachments";
import { attachmentsQuery, familyMemberQuery, prescriptionQuery } from "@/lib/queries";
import type { Attachment } from "@/lib/types";
import { useActionError } from "@/lib/use-action-error";

export const Route = createFileRoute("/_authenticated/prescriptions/$prescriptionId")({
  head: () => ({
    meta: [
      { title: "Prescription — CareBox" },
      { name: "description", content: "View a saved prescription and its scanned attachments." },
      { property: "og:title", content: "Prescription — CareBox" },
      { property: "og:description", content: "View a saved prescription and its scanned attachments." },
    ],
  }),
  component: PrescriptionDetail,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function AttachmentTile({
  attachment,
  onOpenImage,
}: {
  attachment: Attachment;
  onOpenImage: () => void;
}) {
  const { data: url } = useQuery({
    queryKey: ["signed-url", attachment.storage_path],
    queryFn: () => signedUrl(attachment.storage_path),
    staleTime: 50 * 60 * 1000,
  });

  if (!isImage(attachment.mime_type)) {
    return (
      <button
        type="button"
        onClick={() => url && window.open(url, "_blank", "noopener")}
        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <FileText className="h-7 w-7" />
        <span className="flex items-center gap-1 text-[10px] uppercase">
          PDF <ExternalLink className="h-3 w-3" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenImage}
      className="group aspect-square overflow-hidden rounded-xl border border-border bg-muted transition-all hover:border-primary hover:shadow-[var(--shadow-lift)]"
    >
      {url ? (
        <img
          src={url}
          alt={attachment.original_file_name}
          loading="lazy"
          className="animate-fade-in h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </button>
  );
}

function Lightbox({
  attachments,
  index,
  onClose,
  onIndexChange,
}: {
  attachments: Attachment[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const current = attachments[index];
  const { data: url } = useQuery({
    queryKey: ["signed-url", current?.storage_path],
    queryFn: () => signedUrl(current!.storage_path),
    enabled: Boolean(current),
    staleTime: 50 * 60 * 1000,
  });

  if (!current) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-foreground/95">
      <div className="flex justify-end p-3 sm:p-4">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-full text-background transition-colors hover:bg-background/15"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-2">
        {url && (
          <img
            src={url}
            alt={current.original_file_name}
            className="animate-fade-in max-h-full max-w-full rounded-lg object-contain"
          />
        )}
      </div>
      <div className="flex items-center justify-center gap-2 p-6">
        {attachments.map((a, i) => (
          <button
            key={a.id}
            type="button"
            aria-label={`Show attachment ${i + 1}`}
            onClick={() => onIndexChange(i)}
            className="grid h-10 w-10 place-items-center"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === index ? "bg-background" : "bg-background/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function PrescriptionDetail() {
  const { prescriptionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportError = useActionError();
  const prescription = useQuery(prescriptionQuery(prescriptionId));
  const member = useQuery({
    ...familyMemberQuery(prescription.data?.family_member_id ?? ""),
    enabled: Boolean(prescription.data?.family_member_id),
  });
  const attachments = useQuery(attachmentsQuery(prescriptionId));
  const images = (attachments.data ?? []).filter((a) => isImage(a.mime_type));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function handleDelete() {
    try {
      await deletePrescriptionWithFiles(prescriptionId);
      await queryClient.invalidateQueries();
      toast.success("Prescription deleted");
      const memberId = prescription.data?.family_member_id;
      if (memberId) navigate({ to: "/family/$memberId", params: { memberId }, replace: true });
      else navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      reportError(error, {
        fallback: "We couldn't delete this prescription. Please try again.",
        retry: handleDelete,
      });
    }
  }

  const memberId = prescription.data?.family_member_id;

  return (
    <div>
      <PageHeader
        title={prescription.data ? formatDate(prescription.data.prescription_date) : "Prescription"}
        {...(member.data?.name ? { subtitle: member.data.name } : {})}
        {...(memberId ? { backTo: "/family/$memberId", backParams: { memberId } } : { backTo: "/dashboard" })}
        action={
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="icon" className="h-11 w-11">
              <Link
                to="/prescriptions/$prescriptionId/edit"
                params={{ prescriptionId }}
                aria-label="Edit prescription"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 text-destructive hover:text-destructive"
              aria-label="Delete prescription"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-4">
          {prescription.isLoading && <Skeleton className="h-32 rounded-xl" />}
          {prescription.data && (
            <div className="stat-card animate-fade-in space-y-3 p-4 sm:p-5">
              <div>
                <p className="text-eyebrow">Doctor</p>
                <p className="text-body mt-0.5 text-foreground">
                  {prescription.data.doctor_name || "No doctor recorded"}
                </p>
              </div>
              {prescription.data.specialty && (
                <div>
                  <p className="text-eyebrow">Specialty</p>
                  <p className="text-body mt-0.5 text-foreground">{prescription.data.specialty}</p>
                </div>
              )}
              {prescription.data.notes && (
                <div>
                  <p className="text-eyebrow">Notes</p>
                  <p className="text-body mt-0.5 whitespace-pre-wrap text-muted-foreground">
                    {prescription.data.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <section className="space-y-3">
          <h2 className="text-section-title text-foreground">Attachments</h2>
          {attachments.isLoading && <Skeleton className="h-32 rounded-xl" />}
          {!attachments.isLoading && (attachments.data?.length ?? 0) === 0 && (
            <EmptyState
              icon={ImageOff}
              title="No files attached"
              description="Add a photo or PDF of this prescription so you always have it to hand."
              action={
                <Button asChild className="h-11">
                  <Link to="/prescriptions/$prescriptionId/edit" params={{ prescriptionId }}>
                    <Plus className="mr-1 h-4 w-4" /> Add attachments
                  </Link>
                </Button>
              }
            />
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {(attachments.data ?? []).map((attachment) => (
              <AttachmentTile
                key={attachment.id}
                attachment={attachment}
                onOpenImage={() => setLightboxIndex(images.findIndex((i) => i.id === attachment.id))}
              />
            ))}
          </div>
        </section>
      </div>

      {lightboxIndex !== null && lightboxIndex >= 0 && (
        <Lightbox
          attachments={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this prescription?"
        description="Its attached photos and PDFs will be permanently removed too. This can't be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
