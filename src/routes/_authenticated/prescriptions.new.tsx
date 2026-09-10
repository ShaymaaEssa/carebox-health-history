import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { PrescriptionFields } from "@/components/prescription-fields";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachment, validateFile } from "@/lib/attachments";
import { useAuth } from "@/lib/auth";
import { MAX_ATTACHMENTS } from "@/lib/types";
import { useActionError } from "@/lib/use-action-error";
import { FileText, Loader2, Plus, X } from "lucide-react";

const searchSchema = z.object({ memberId: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/_authenticated/prescriptions/new")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Add prescription — CareBox" },
      { name: "description", content: "Save a new prescription with up to four photos or PDFs." },
      { property: "og:title", content: "Add prescription — CareBox" },
      { property: "og:description", content: "Save a new prescription with up to four photos or PDFs." },
    ],
  }),
  component: NewPrescription,
});

function NewPrescription() {
  const { memberId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportError = useActionError();
  const { user } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const full = files.length >= MAX_ATTACHMENTS;

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const remaining = MAX_ATTACHMENTS - files.length;
    const accepted: File[] = [];
    for (const file of Array.from(list).slice(0, remaining)) {
      const invalid = validateFile(file);
      if (invalid) {
        setError(invalid);
        toast.error(invalid);
      } else accepted.push(file);
    }
    if (list.length > remaining) {
      const message = "You've reached the 4-attachment limit for this prescription.";
      setError(message);
      toast.error(message);
    }
    setFiles((prev) => [...prev, ...accepted]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !memberId) return;
    setBusy(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("prescriptions")
      .insert({
        user_id: user.id,
        family_member_id: memberId,
        prescription_date: date,
        doctor_name: doctor.trim() || null,
        specialty: specialty.trim() || null,
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setBusy(false);
      setError(
        reportError(insertError, {
          fallback: "Something went wrong saving this — please try again.",
        }),
      );
      return;
    }

    const prescriptionId = data.id as string;
    let uploadIssue: string | null = null;
    for (const file of files) {
      const { error: uploadError } = await uploadAttachment({
        userId: user.id,
        prescriptionId,
        file,
      });
      if (uploadError) uploadIssue = uploadError;
    }

    await queryClient.invalidateQueries();
    setBusy(false);
    if (uploadIssue) {
      toast.error(uploadIssue);
      toast.success("Prescription saved");
    } else {
      toast.success(files.length ? "Prescription saved with attachments" : "Prescription saved");
    }
    navigate({ to: "/prescriptions/$prescriptionId", params: { prescriptionId }, replace: true });
  }

  if (!memberId) {
    return (
      <div>
        <PageHeader title="Add prescription" backTo="/dashboard" />
        <p className="text-body text-muted-foreground">
          Open a family member first, then add a prescription for them.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Add prescription"
        subtitle="Record the visit details and attach up to four photos or PDFs."
        backTo="/family/$memberId"
        backParams={{ memberId }}
      />
      <form className="max-w-3xl space-y-8" onSubmit={handleSubmit}>
        <PrescriptionFields
          date={date}
          setDate={setDate}
          doctor={doctor}
          setDoctor={setDoctor}
          specialty={specialty}
          setSpecialty={setSpecialty}
          notes={notes}
          setNotes={setNotes}
          disabled={busy}
        />

        <div className="form-surface space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-card-title text-foreground">Attachments</span>
            <span className="text-meta shrink-0">
              {files.length}/{MAX_ATTACHMENTS}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
              >
                {file.type === "application/pdf" ? (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <FileText className="h-7 w-7" />
                    <span className="text-[10px] uppercase">PDF</span>
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                  className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {!full && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50 hover:text-primary">
                <Plus className="h-5 w-5" />
                <span className="text-xs">Add file</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          {full && (
            <p className="text-meta">
              You've reached the 4-attachment limit for this prescription — remove one to add another.
            </p>
          )}
          <p className="text-meta">
            JPG, PNG, WebP or PDF · up to 20 MB each. Images are optimized before upload.
          </p>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        <Button type="submit" className="h-12 w-full sm:w-auto sm:min-w-52" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? (files.length ? "Uploading…" : "Saving…") : "Save prescription"}
        </Button>
      </form>
    </div>
  );
}
