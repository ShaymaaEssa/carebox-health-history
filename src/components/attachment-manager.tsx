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

import { Button } from "@/components/ui/button";
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
      className={`relative overflow-hidden rounded-xl border border-border bg-muted ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex aspect-square items-center justify-center">
        {isImage(attachment.mime_type) && url ? (
          <img
            src={url}
            alt={attachment.original_file_name}
            loading="lazy"
            className="h-full w-full object-cover"
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
        className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Reorder attachment"
        className="absolute bottom-1 left-1 cursor-grab rounded-full bg-foreground/60 p-1 text-background touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
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
  const { data: attachments = [], isLoading } = useQuery(attachmentsQuery(prescriptionId));
  const [items, setItems] = useState<Attachment[] | null>(null);
  const list = items ?? attachments;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor));

  const full = list.length >= MAX_ATTACHMENTS;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const remaining = MAX_ATTACHMENTS - list.length;
    const chosen = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only ${remaining} more file${remaining === 1 ? "" : "s"} can be added to this prescription.`);
    }
    setBusy(true);
    for (const file of chosen) {
      const invalid = validateFile(file);
      if (invalid) {
        setError(invalid);
        continue;
      }
      const { error: uploadError } = await uploadAttachment({ userId, prescriptionId, file });
      if (uploadError) setError(uploadError);
    }
    setBusy(false);
    setItems(null);
    await queryClient.invalidateQueries({ queryKey: ["attachments", prescriptionId] });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(attachment: Attachment) {
    try {
      await removeAttachment(attachment);
      setItems(null);
      await queryClient.invalidateQueries({ queryKey: ["attachments", prescriptionId] });
      toast.success("Attachment removed");
    } catch {
      setError("We couldn't remove that file. Please try again.");
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
    } catch {
      setItems(null);
      setError("We couldn't save the new order. Please try again.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Attachments</span>
        <span className="text-xs text-muted-foreground">
          {list.length}/{MAX_ATTACHMENTS} attachments
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={list.map((a) => a.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {isLoading && <div className="aspect-square animate-pulse rounded-xl bg-muted" />}
            {list.map((attachment) => (
              <Thumb
                key={attachment.id}
                attachment={attachment}
                onRemove={() => handleRemove(attachment)}
              />
            ))}
            {!full && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-[10px]">optimizing…</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px]">Add file</span>
                  </>
                )}
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {full && (
        <p className="text-xs text-muted-foreground">
          Maximum of 4 attachments reached — remove one to add another.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP or PDF · up to 20 MB each. Images are optimized before upload.
      </p>
      <Button type="button" variant="ghost" size="sm" className="hidden" />
    </div>
  );
}
