import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import {
  Check,
  ChevronLeft,
  FileText,
  Loader2,
  LockKeyhole,
  Paperclip,
  Plus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/empty-state";
import { PrescriptionFields } from "@/components/prescription-fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachment, validateFile } from "@/lib/attachments";
import { useAuth } from "@/lib/auth";
import { memberInitials, memberStyle } from "@/lib/member-style";
import {
  validatePrescriptionDetails,
  type PrescriptionDetailsErrors,
} from "@/lib/prescription-details";
import { familyMembersQuery } from "@/lib/queries";
import { MAX_ATTACHMENTS } from "@/lib/types";
import { useActionError } from "@/lib/use-action-error";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ memberId: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/_authenticated/prescriptions/new")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Add prescription — CareBox" },
      { name: "description", content: "Save a new prescription with up to four photos or PDFs." },
      { property: "og:title", content: "Add prescription — CareBox" },
      {
        property: "og:description",
        content: "Save a new prescription with up to four photos or PDFs.",
      },
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
  const members = useQuery(familyMembersQuery);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [doctorInstructions, setDoctorInstructions] = useState("");
  const [optionalErrors, setOptionalErrors] = useState<PrescriptionDetailsErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberList = members.data ?? [];
  const activeMember = memberList.find((m) => m.id === memberId) ?? null;
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
    const details = validatePrescriptionDetails({
      weight_kg: weightKg,
      height_cm: heightCm,
      symptoms,
      doctor_instructions: doctorInstructions,
    });
    setOptionalErrors(details.errors);
    if (!details.success) return;
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
        weight_kg: details.data.weight_kg,
        height_cm: details.data.height_cm,
        symptoms: details.data.symptoms,
        doctor_instructions: details.data.doctor_instructions,
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

  const remainingSlots = Math.max(0, MAX_ATTACHMENTS - files.length);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top back bar */}
      <div className="flex items-center justify-between gap-3">
        {memberId ? (
          <Link
            to="/family/$memberId"
            params={{ memberId }}
            className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />{" "}
            {activeMember ? `Back to ${activeMember.name}` : "Back"}
          </Link>
        ) : (
          <Link
            to="/dashboard"
            className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        )}
      </div>

      {/* Header + Member Selector */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
            New medical record
          </span>
          <h1 className="text-page-title text-foreground">Add prescription</h1>
          <p className="text-body max-w-xl text-muted-foreground">
            Record the visit details and attach up to four prescription photos or PDFs.
          </p>
        </div>

        {members.isLoading ? (
          <Skeleton className="h-14 w-full rounded-[20px] lg:w-80" />
        ) : memberList.length > 0 ? (
          <div className="rounded-[20px] border border-border/80 bg-card p-2 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 text-xs font-semibold text-muted-foreground">Filing for:</span>
              {memberList.map((m) => {
                const selected = m.id === memberId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      navigate({
                        to: "/prescriptions/new",
                        search: { memberId: m.id },
                        replace: true,
                      })
                    }
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                      selected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/60 text-foreground hover:bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                        selected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : memberStyle(m.id).avatar,
                      )}
                    >
                      {memberInitials(m.name) || "?"}
                    </span>
                    <span>{m.name}</span>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {!members.isLoading && memberList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Add a family member first"
          description="Create a family member profile before saving their prescription."
          action={
            <Button asChild className="h-11 rounded-full px-5">
              <Link to="/family/new">
                <UserPlus className="mr-1.5 h-4 w-4" /> Add family member
              </Link>
            </Button>
          }
        />
      ) : !memberId ? (
        <div className="rounded-[20px] border border-border/80 bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <p className="font-display text-lg font-semibold text-foreground">
            Choose who this prescription is for
          </p>
          <p className="text-meta mt-1">
            Select a family member above to attach and save their prescription.
          </p>
        </div>
      ) : (
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start"
          onSubmit={handleSubmit}
        >
          {/* Left column: Consultation Details */}
          <div className="space-y-5">
            <PrescriptionFields
              date={date}
              setDate={setDate}
              doctor={doctor}
              setDoctor={setDoctor}
              specialty={specialty}
              setSpecialty={setSpecialty}
              notes={notes}
              setNotes={setNotes}
              weightKg={weightKg}
              setWeightKg={(value) => {
                setWeightKg(value);
                setOptionalErrors((prev) => {
                  const next = { ...prev };
                  delete next.weight_kg;
                  return next;
                });
              }}
              heightCm={heightCm}
              setHeightCm={(value) => {
                setHeightCm(value);
                setOptionalErrors((prev) => {
                  const next = { ...prev };
                  delete next.height_cm;
                  return next;
                });
              }}
              symptoms={symptoms}
              setSymptoms={(value) => {
                setSymptoms(value);
                setOptionalErrors((prev) => {
                  const next = { ...prev };
                  delete next.symptoms;
                  return next;
                });
              }}
              doctorInstructions={doctorInstructions}
              setDoctorInstructions={(value) => {
                setDoctorInstructions(value);
                setOptionalErrors((prev) => {
                  const next = { ...prev };
                  delete next.doctor_instructions;
                  return next;
                });
              }}
              optionalErrors={optionalErrors}
              disabled={busy}
            />

            <div className="hidden items-center gap-3 lg:flex">
              <Button
                type="submit"
                className="h-12 min-w-56 cursor-pointer rounded-full px-6 font-semibold shadow-[0_6px_18px_-4px_rgba(13,94,79,0.28)]"
                disabled={busy}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy
                  ? files.length
                    ? "Uploading…"
                    : "Saving…"
                  : activeMember
                    ? `Save to ${activeMember.name}'s vault`
                    : "Save prescription"}
              </Button>
              <Button asChild type="button" variant="ghost" className="h-12 rounded-full px-5">
                <Link to="/family/$memberId" params={{ memberId }}>
                  Cancel
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column: Attachments */}
          <div className="space-y-4">
            <div className="rounded-[20px] border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Prescription files
                  </h2>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
                  {files.length} of {MAX_ATTACHMENTS}
                </span>
              </div>
              <p className="text-meta mt-1">Snap handwritten scripts, pharmacy labels, or PDFs.</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[16px] border border-border/80 bg-muted shadow-2xs"
                  >
                    {file.type === "application/pdf" ? (
                      <div className="flex flex-col items-center gap-1.5 px-2 text-center text-muted-foreground">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                          <FileText className="h-5 w-5" />
                        </span>
                        <span className="max-w-full truncate text-[11px] font-semibold text-foreground">
                          {file.name}
                        </span>
                        <span className="text-[10px] font-semibold uppercase">PDF</span>
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
                      className="absolute top-2 right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-destructive text-destructive-foreground shadow-xs transition-transform hover:scale-105"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {Array.from({ length: remainingSlots }).map((_, slotIndex) => (
                  <label
                    key={`slot-${slotIndex}`}
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-border bg-secondary/35 p-3 text-center transition-colors hover:border-primary hover:bg-secondary/65"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow-2xs">
                      <Plus className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">Add photo or PDF</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      Slot {files.length + slotIndex + 1}
                    </span>
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
                ))}
              </div>

              {full && (
                <p className="mt-3 rounded-xl bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                  You've reached the 4-attachment limit for this prescription — remove one to add
                  another.
                </p>
              )}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                JPG, PNG, WebP or PDF · up to 20 MB each. Images are optimized before upload.
              </p>
              {error && (
                <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 rounded-[20px] border border-border/70 bg-secondary/45 p-4">
              <LockKeyhole className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Attachments are stored privately and loaded via time-limited signed URLs.
              </p>
            </div>
          </div>

          {/* Mobile submit bar */}
          <div className="flex flex-col gap-2 lg:hidden">
            <Button
              type="submit"
              className="h-12 w-full cursor-pointer rounded-full font-semibold shadow-[0_6px_18px_-4px_rgba(13,94,79,0.28)]"
              disabled={busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy
                ? files.length
                  ? "Uploading…"
                  : "Saving…"
                : activeMember
                  ? `Save to ${activeMember.name}'s vault`
                  : "Save prescription"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
