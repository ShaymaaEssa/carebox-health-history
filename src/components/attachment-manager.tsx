import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, GripVertical, Loader2, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  removeAttachment,
  reorderAttachments,
  signedUrl,
  uploadAttachment,
  isImage,
  validateFile,
} from "@/lib/attachments";
import { attachmentsQuery } from "@/lib/queries";
import { MAX_ATTACHMENTS, type Attachment } from "@/lib/types";
import { useActionError } from "@/lib/use-action-error";

function Thumb({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attachment.id,
  });
  const { data: url } = useQuery({
    queryKey: ["signed-url", attachment.storage_path],
    queryFn: () => signedUrl(attachment.storage_path),
    enabled: isImage(attachment.mime_type),
    staleTime: 50 * 60 * 1000,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative overflow-hidden rounded-xl border border-border bg-muted transition-shadow ${
        isDragging ? "opacity-70 shadow-[var(--shadow-lift)]" : ""
      }`}
    >
      <div className="flex aspect-square items-center justify-center">
        {isImage(attachment.mime_type) && url ? (
          <img
            src={url}
            alt={attachment.original_file_name}
            loading="lazy"
            className="animate-fade-in h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <FileText className="h-7 w-7" />
            <span className="text-[10px] uppercase">PDF</span>
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Remove attachment"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-destructive"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Reorder attachment"
        className="absolute bottom-1.5 left-1.5 grid h-9 w-9 cursor-grab touch-none place-items-center rounded-full bg-foreground/60 text-background active:cursor-grabbing"
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
      await reorderAttachments(prescriptionId, next.map((a) => a.id));
      await queryClient.invalidateQueries({ queryKey: ["attachments", prescriptionId] });
      setItems(null);
      toast.success("Order saved");
    } catch (err) {
      setItems(null);
      setError(reportError(err, { fallback: "We couldn't save the new order. Please try again." }));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-card-title text-foreground">Attachments</span>
        <span className="text-meta shrink-0">
          {list.length}/{MAX_ATTACHMENTS}
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={list.map((a) => a.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {isLoading && <div className="aspect-square animate-pulse rounded-xl bg-muted" />}
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
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50 hover:text-primary disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Add file</span>
                  </>
                )}
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {full && (
        <p className="text-meta">
          You've reached the 4-attachment limit for this prescription — remove one to add another.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-meta">
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
