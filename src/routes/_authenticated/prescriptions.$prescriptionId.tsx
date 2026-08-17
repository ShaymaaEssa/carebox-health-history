import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileText, Pencil, Trash2, X } from "lucide-react";
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
import { deletePrescriptionWithFiles, isImage, signedUrl } from "@/lib/attachments";
import { attachmentsQuery, familyMemberQuery, prescriptionQuery } from "@/lib/queries";
import type { Attachment } from "@/lib/types";

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
  return new Date(value).toLocaleDateString(undefined, {
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
        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted text-muted-foreground"
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
      className="aspect-square overflow-hidden rounded-xl border border-border bg-muted"
    >
      {url ? (
        <img
          src={url}
          alt={attachment.original_file_name}
          loading="lazy"
          className="h-full w-full object-cover"
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
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground/95">
      <div className="flex justify-end p-4">
        <button type="button" aria-label="Close" onClick={onClose} className="text-background">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        {url && <img src={url} alt={current.original_file_name} className="max-h-full max-w-full object-contain" />}
      </div>
      <div className="flex items-center justify-center gap-3 p-6">
        {attachments.map((a, i) => (
          <button
            key={a.id}
            type="button"
            aria-label={`Show attachment ${i + 1}`}
            onClick={() => onIndexChange(i)}
            className={`h-2 w-2 rounded-full ${i === index ? "bg-background" : "bg-background/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

function PrescriptionDetail() {
  const { prescriptionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    } catch {
      toast.error("We couldn't delete this prescription.");
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
            <Button asChild variant="outline" size="icon">
              <Link
                to="/prescriptions/$prescriptionId/edit"
                params={{ prescriptionId }}
                aria-label="Edit prescription"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" aria-label="Delete prescription" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {prescription.isLoading && <Skeleton className="h-28 rounded-xl" />}

      {prescription.data && (
        <Card className="mb-6">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="text-foreground">{prescription.data.doctor_name || "No doctor recorded"}</p>
            {prescription.data.specialty && (
              <p className="text-muted-foreground">{prescription.data.specialty}</p>
            )}
            {prescription.data.notes && (
              <p className="whitespace-pre-wrap text-muted-foreground">{prescription.data.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-medium text-foreground">Attachments</h2>
      {attachments.isLoading && <Skeleton className="h-24 rounded-xl" />}
      {!attachments.isLoading && (attachments.data?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">
          No files attached. Edit this prescription to add photos or PDFs.
        </p>
      )}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {(attachments.data ?? []).map((attachment) => (
          <AttachmentTile
            key={attachment.id}
            attachment={attachment}
            onOpenImage={() => setLightboxIndex(images.findIndex((i) => i.id === attachment.id))}
          />
        ))}
      </div>

      {lightboxIndex !== null && lightboxIndex >= 0 && (
        <Lightbox
          attachments={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              Its attached photos and PDFs will be permanently removed too.
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
