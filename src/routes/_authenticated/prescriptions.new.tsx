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
import { FileText, Plus, X } from "lucide-react";

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
      if (invalid) setError(invalid);
      else accepted.push(file);
    }
    if (list.length > remaining) {
      setError(`You can attach at most ${MAX_ATTACHMENTS} files to a prescription.`);
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
      setError("We couldn't save this prescription. Please try again.");
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
    if (uploadIssue) toast.error(uploadIssue);
    else toast.success("Prescription saved");
    navigate({ to: "/prescriptions/$prescriptionId", params: { prescriptionId }, replace: true });
  }

  if (!memberId) {
    return (
      <div>
        <PageHeader title="Add prescription" backTo="/dashboard" />
        <p className="text-sm text-muted-foreground">
          Open a family member first, then add a prescription for them.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Add prescription" backTo="/family/$memberId" backParams={{ memberId }} />
      <form className="space-y-6" onSubmit={handleSubmit}>
        <PrescriptionFields
          date={date}
          setDate={setDate}
          doctor={doctor}
          setDoctor={setDoctor}
          specialty={specialty}
          setSpecialty={setSpecialty}
          notes={notes}
          setNotes={setNotes}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Attachments</span>
            <span className="text-xs text-muted-foreground">
              {files.length}/{MAX_ATTACHMENTS} attachments
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
                  className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {!full && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Plus className="h-5 w-5" />
                <span className="text-[10px]">Add file</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          {full && (
            <p className="text-xs text-muted-foreground">
              Maximum of 4 attachments reached — remove one to add another.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP or PDF · up to 20 MB each. Images are optimized before upload.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {busy ? "Saving…" : "Save prescription"}
        </Button>
      </form>
    </div>
  );
}
