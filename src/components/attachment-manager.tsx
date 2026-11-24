import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, GripVertical, Loader2, Paperclip, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isImage,
  removeAttachment,
  reorderAttachments,
  signedUrl,
  uploadAttachment,
  validateFile,
} from "@/lib/attachments";
import { attachmentsQuery } from "@/lib/queries";
import { MAX_ATTACHMENTS, type Attachment } from "@/lib/types";
import { useActionError } from "@/lib/use-action-error";

function Thumb({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attachment.id,
  });
  const { data: url, isLoading } = useQuery({
    queryKey: ["signed-url", attachment.storage_path],
    queryFn: () => signedUrl(attachment.storage_path),
    enabled: isImage(attachment.mime_type),
    staleTime: 50 * 60 * 1000,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative overflow-hidden rounded-[16px] border border-border/80 bg-muted shadow-2xs transition-shadow ${
        isDragging ? "opacity-75 shadow-[var(--shadow-lift)]" : ""
      }`}
    >
      <div className="flex aspect-square items-center justify-center">
        {isImage(attachment.mime_type) ? (
          isLoading ? (
            <Skeleton className="h-full w-full rounded-[16px]" />
          ) : url ? (
            <img
              src={url}
              alt={attachment.original_file_name}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="animate-fade-in h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <FileText className="h-6 w-6" />
              <span className="text-[10px] uppercase">Image</span>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-2 text-center text-muted-foreground">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <span className="max-w-full truncate text-[11px] font-semibold text-foreground">
              {attachment.original_file_name}
            </span>
            <span className="text-[10px] font-semibold uppercase">PDF</span>
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Remove attachment"
        onClick={onRemove}
        className="absolute top-2 right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-destructive text-destructive-foreground shadow-xs transition-transform hover:scale-105"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Reorder attachment"
        className="absolute bottom-2 left-2 grid h-8 w-8 cursor-grab touch-none place-items-center rounded-full bg-foreground/70 text-background shadow-xs active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AttachmentManager({
  prescriptionId,
  userId,
}: {
  prescriptionId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const reportError = useActionError();
  const { data: attachments = [], isLoading } = useQuery(attachmentsQuery(prescriptionId));
  const [items, setItems] = useState<Attachment[] | null>(null);
  const list = items ?? attachments;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Attachment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const full = list.length >= MAX_ATTACHMENTS;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const remaining = MAX_ATTACHMENTS - list.length;
    const chosen = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setError("You've reached the 4-attachment limit for this prescription.");
    }
    setBusy(true);
    let uploaded = 0;
    for (const file of chosen) {
      const invalid = validateFile(file);
      if (invalid) {
        setError(invalid);
        toast.error(invalid);
        continue;
      }
      const { error: uploadError } = await uploadAttachment({ userId, prescriptionId, file });
      if (uploadError) {
        setError(uploadError);
        toast.error(uploadError);
      } else {
        uploaded += 1;
      }
    }
    setBusy(false);
    setItems(null);
    await queryClient.invalidateQueries({ queryKey: ["attachments", prescriptionId] });
    await queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? "Photo uploaded" : `${uploaded} files uploaded`);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function confirmRemove() {
    if (!pendingRemoval) return;
    try {
      await removeAttachment(pendingRemoval);
      setItems(null);
      await queryClient.invalidateQueries({ queryKey: ["attachments", prescriptionId] });
      toast.success("Attachment removed");
      setPendingRemoval(null);
    } catch (err) {
      setError(reportError(err, { fallback: "We couldn't remove that file. Please try again." }));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = list.findIndex((a) => a.id === active.id);
    const newIndex = list.findIndex((a) => a.id === over.id);
    const next = arrayMove(list, oldIndex, newIndex);
    setItems(next);
    try {
      await reorderAttachments(
        prescriptionId,
        next.map((a) => a.id),
      );
      await queryClient.invalidateQueries({ queryKey: ["attachments", prescriptionId] });
      setItems(null);
      toast.success("Order saved");
    } catch (err) {
      setItems(null);
      setError(reportError(err, { fallback: "We couldn't save the new order. Please try again." }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          <span className="font-display text-lg font-semibold text-foreground">
            Prescription files
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
          {list.length} of {MAX_ATTACHMENTS}
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={list.map((a) => a.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3">
            {isLoading && <Skeleton className="aspect-square rounded-[16px]" />}
            {list.map((attachment) => (
              <Thumb
                key={attachment.id}
                attachment={attachment}
                onRemove={() => setPendingRemoval(attachment)}
              />
            ))}
            {!full && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-border bg-secondary/35 p-3 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/65 hover:text-primary disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Uploading…</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow-2xs">
                      <Plus className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">Add photo or PDF</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      Slot {list.length + 1} of {MAX_ATTACHMENTS}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {full && (
        <p className="rounded-xl bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
          You've reached the 4-attachment limit for this prescription — remove one to add another.
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        JPG, PNG, WebP or PDF · up to 20 MB each. Images are optimized before upload. Drag the
        handle to reorder.
      </p>

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title="Remove this attachment?"
        description="The file will be permanently deleted from this prescription."
        confirmLabel="Remove"
        busyLabel="Removing…"
        onConfirm={confirmRemove}
      />
    </div>
  );
}
