import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  ImageOff,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Stethoscope,
  Trash2,
  User,
  X,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deletePrescriptionWithFiles, isImage, signedUrl } from "@/lib/attachments";
import { memberInitials, memberStyle } from "@/lib/member-style";
import { attachmentsQuery, familyMemberQuery, prescriptionQuery } from "@/lib/queries";
import type { Attachment } from "@/lib/types";
import { useActionError } from "@/lib/use-action-error";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prescriptions/$prescriptionId")({
  head: () => ({
    meta: [
      { title: "Prescription — CareBox" },
      { name: "description", content: "View a saved prescription and its scanned attachments." },
      { property: "og:title", content: "Prescription — CareBox" },
      {
        property: "og:description",
        content: "View a saved prescription and its scanned attachments.",
      },
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

function AttachmentThumbnail({
  attachment,
  active,
  onSelect,
}: {
  attachment: Attachment;
  active: boolean;
  onSelect: () => void;
}) {
  const { data: url, isLoading } = useQuery({
    queryKey: ["signed-url", attachment.storage_path],
    queryFn: () => signedUrl(attachment.storage_path),
    enabled: isImage(attachment.mime_type),
    staleTime: 50 * 60 * 1000,
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[14px] border bg-muted transition-all",
        active
          ? "border-primary ring-2 ring-primary/30"
          : "border-border/80 opacity-80 hover:opacity-100",
      )}
      aria-label={`Select ${attachment.original_file_name}`}
    >
      {!isImage(attachment.mime_type) ? (
        <div className="flex flex-col items-center gap-0.5 text-primary">
          <FileText className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase">PDF</span>
        </div>
      ) : isLoading ? (
        <Skeleton className="h-full w-full rounded-[14px]" />
      ) : url ? (
        <img
          src={url}
          alt={attachment.original_file_name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <FileText className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  );
}

function FeaturedAttachment({
  attachment,
  index,
  total,
  onOpenLightbox,
}: {
  attachment: Attachment;
  index: number;
  total: number;
  onOpenLightbox: () => void;
}) {
  const { data: url, isLoading } = useQuery({
    queryKey: ["signed-url", attachment.storage_path],
    queryFn: () => signedUrl(attachment.storage_path),
    staleTime: 50 * 60 * 1000,
  });

  if (!isImage(attachment.mime_type)) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-[16px] bg-secondary/45 p-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary shadow-xs">
          <FileText className="h-7 w-7" />
        </span>
        <div className="max-w-xs space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {attachment.original_file_name}
          </p>
          <p className="text-xs text-muted-foreground">PDF prescription document</p>
        </div>
        <Button
          type="button"
          disabled={!url}
          onClick={() => url && window.open(url, "_blank", "noopener")}
          className="mt-1 h-10 cursor-pointer rounded-full px-4 text-xs font-semibold"
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Open PDF
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-[16px] bg-muted">
      {isLoading || !url ? (
        <Skeleton className="h-full w-full rounded-[16px]" />
      ) : (
        <button
          type="button"
          onClick={onOpenLightbox}
          className="block h-full w-full cursor-zoom-in"
          aria-label="Open full-screen preview"
        >
          <img
            src={url}
            alt={attachment.original_file_name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="animate-fade-in h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenLightbox}
        aria-label="Zoom image"
        className="absolute top-3 right-3 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur-xs transition-transform hover:scale-105"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <span className="truncate rounded-full bg-foreground/70 px-3 py-1 text-[11px] font-medium text-background backdrop-blur-xs">
          {attachment.original_file_name}
        </span>
        <span className="shrink-0 rounded-full bg-foreground/70 px-2.5 py-1 text-[11px] font-semibold text-background tabular-nums backdrop-blur-xs">
          Page {index + 1} of {total}
        </span>
      </div>
    </div>
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
      <div className="flex items-center justify-between p-3 sm:p-4">
        <span className="px-2 text-xs font-medium text-background/80 tabular-nums">
          {index + 1} / {attachments.length}
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-background transition-colors hover:bg-background/15"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-2">
        {attachments.length > 1 && (
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => onIndexChange((index - 1 + attachments.length) % attachments.length)}
            className="absolute left-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-background/15 text-background transition-colors hover:bg-background/25"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {url && (
          <img
            src={url}
            alt={current.original_file_name}
            referrerPolicy="no-referrer"
            className="animate-fade-in max-h-[78vh] max-w-full rounded-xl object-contain"
          />
        )}
        {attachments.length > 1 && (
          <button
            type="button"
            aria-label="Next image"
            onClick={() => onIndexChange((index + 1) % attachments.length)}
            className="absolute right-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-background/15 text-background transition-colors hover:bg-background/25"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 p-6">
        {attachments.map((a, i) => (
          <button
            key={a.id}
            type="button"
            aria-label={`Show attachment ${i + 1}`}
            onClick={() => onIndexChange(i)}
            className="grid h-10 w-10 cursor-pointer place-items-center"
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
  const attachmentList = attachments.data ?? [];
  const images = attachmentList.filter((a) => isImage(a.mime_type));
  const [selectedIdx, setSelectedIdx] = useState(0);
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
  const activeAttachment = attachmentList[selectedIdx] ?? attachmentList[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top navigation strip */}
      <div className="flex items-center justify-between gap-3">
        {memberId ? (
          <Link
            to="/family/$memberId"
            params={{ memberId }}
            className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />{" "}
            {member.data?.name ? `Back to ${member.data.name}` : "Back"}
          </Link>
        ) : (
          <Link
            to="/dashboard"
            className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-card shadow-2xs"
          >
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
            className="h-10 w-10 rounded-full bg-card text-destructive shadow-2xs hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete prescription"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main 2-column content */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        {/* Attachments gallery */}
        <section className="space-y-4">
          {attachments.isLoading ? (
            <div className="rounded-[20px] border border-border/80 bg-card p-3 shadow-[var(--shadow-card)]">
              <Skeleton className="aspect-[4/3] w-full rounded-[16px]" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-16 w-16 rounded-[14px]" />
                <Skeleton className="h-16 w-16 rounded-[14px]" />
              </div>
            </div>
          ) : attachmentList.length === 0 ? (
            <EmptyState
              icon={ImageOff}
              title="No files attached"
              description="Add a photo or PDF of this prescription so you always have it to hand."
              action={
                <Button asChild className="h-11 rounded-full px-5">
                  <Link to="/prescriptions/$prescriptionId/edit" params={{ prescriptionId }}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add attachments
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="rounded-[20px] border border-border/80 bg-card p-3.5 shadow-[var(--shadow-card)] sm:p-4">
              {activeAttachment && (
                <FeaturedAttachment
                  attachment={activeAttachment}
                  index={Math.min(selectedIdx, attachmentList.length - 1)}
                  total={attachmentList.length}
                  onOpenLightbox={() => {
                    const idx = images.findIndex((i) => i.id === activeAttachment.id);
                    if (idx >= 0) setLightboxIndex(idx);
                  }}
                />
              )}

              {attachmentList.length > 1 && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {attachmentList.map((attachment, idx) => (
                      <AttachmentThumbnail
                        key={attachment.id}
                        attachment={attachment}
                        active={idx === selectedIdx}
                        onSelect={() => setSelectedIdx(idx)}
                      />
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Previous attachment"
                      onClick={() =>
                        setSelectedIdx(
                          (selectedIdx - 1 + attachmentList.length) % attachmentList.length,
                        )
                      }
                      className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-secondary"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next attachment"
                      onClick={() => setSelectedIdx((selectedIdx + 1) % attachmentList.length)}
                      className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-secondary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Doctor, Visit & Clinical Details */}
        <div className="space-y-4">
          {prescription.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-[20px]" />
              <Skeleton className="h-40 rounded-[20px]" />
            </div>
          ) : (
            prescription.data && (
              <>
                <section className="rounded-[20px] border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                        <Stethoscope className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                          {prescription.data.doctor_name || "No doctor recorded"}
                        </h1>
                        {prescription.data.specialty && (
                          <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {prescription.data.specialty}
                          </span>
                        )}
                      </div>
                    </div>

                    {member.data && memberId && (
                      <Link
                        to="/family/$memberId"
                        params={{ memberId }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                            memberStyle(memberId).avatar,
                          )}
                        >
                          {memberInitials(member.data.name) || <User className="h-3 w-3" />}
                        </span>
                        <span>{member.data.name}</span>
                      </Link>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {formatDate(prescription.data.prescription_date)}
                    </span>
                    {member.data?.relationship && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {member.data.relationship}
                      </span>
                    )}
                  </div>

                  {prescription.data.notes && (
                    <div className="mt-4 rounded-2xl bg-secondary/45 p-4">
                      <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        Prescription notes
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {prescription.data.notes}
                      </p>
                    </div>
                  )}
                </section>

                {(prescription.data.weight_kg != null ||
                  prescription.data.height_cm != null ||
                  prescription.data.symptoms ||
                  prescription.data.doctor_instructions) && (
                  <section className="space-y-4 rounded-[20px] border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        Consultation &amp; vitals
                      </h2>
                    </div>

                    {(prescription.data.weight_kg != null ||
                      prescription.data.height_cm != null) && (
                      <div className="grid grid-cols-2 gap-3">
                        {prescription.data.weight_kg != null && (
                          <div className="rounded-2xl bg-muted/55 p-3.5">
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                              <Scale className="h-3.5 w-3.5 text-primary" /> Weight
                            </p>
                            <p className="font-display mt-1 text-lg font-semibold text-foreground tabular-nums">
                              {prescription.data.weight_kg} kg
                            </p>
                          </div>
                        )}
                        {prescription.data.height_cm != null && (
                          <div className="rounded-2xl bg-muted/55 p-3.5">
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                              <Ruler className="h-3.5 w-3.5 text-primary" /> Height
                            </p>
                            <p className="font-display mt-1 text-lg font-semibold text-foreground tabular-nums">
                              {prescription.data.height_cm} cm
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {prescription.data.symptoms && (
                      <div className="rounded-2xl bg-muted/55 p-4">
                        <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                          Symptoms noted
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                          {prescription.data.symptoms}
                        </p>
                      </div>
                    )}

                    {prescription.data.doctor_instructions && (
                      <div className="rounded-2xl bg-secondary/45 p-4">
                        <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                          What the doctor said
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                          {prescription.data.doctor_instructions}
                        </p>
                      </div>
                    )}
                  </section>
                )}

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    asChild
                    variant="secondary"
                    className="h-11 flex-1 rounded-full font-semibold text-primary"
                  >
                    <Link to="/prescriptions/$prescriptionId/edit" params={{ prescriptionId }}>
                      <Pencil className="mr-1.5 h-4 w-4" /> Edit prescription
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmOpen(true)}
                    className="h-11 cursor-pointer rounded-full px-5 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                  </Button>
                </div>
              </>
            )
          )}
        </div>
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
