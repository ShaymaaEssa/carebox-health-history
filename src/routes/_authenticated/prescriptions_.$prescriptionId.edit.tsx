import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Loader2, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AttachmentManager } from "@/components/attachment-manager";
import { PrescriptionFields } from "@/components/prescription-fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  validatePrescriptionDetails,
  type PrescriptionDetailsErrors,
} from "@/lib/prescription-details";
import { prescriptionQuery } from "@/lib/queries";
import { useActionError } from "@/lib/use-action-error";

export const Route = createFileRoute("/_authenticated/prescriptions_/$prescriptionId/edit")({
  head: () => ({
    meta: [
      { title: "Edit prescription — CareBox" },
      { name: "description", content: "Update prescription details and manage its attachments." },
      { property: "og:title", content: "Edit prescription — CareBox" },
      {
        property: "og:description",
        content: "Update prescription details and manage its attachments.",
      },
    ],
  }),
  component: EditPrescription,
});

function EditPrescription() {
  const { prescriptionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportError = useActionError();
  const { user } = useAuth();
  const prescription = useQuery(prescriptionQuery(prescriptionId));

  const [date, setDate] = useState("");
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [doctorInstructions, setDoctorInstructions] = useState("");
  const [optionalErrors, setOptionalErrors] = useState<PrescriptionDetailsErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prescription.data) return;
    setDate(prescription.data.prescription_date.slice(0, 10));
    setDoctor(prescription.data.doctor_name ?? "");
    setSpecialty(prescription.data.specialty ?? "");
    setNotes(prescription.data.notes ?? "");
    setWeightKg(prescription.data.weight_kg == null ? "" : String(prescription.data.weight_kg));
    setHeightCm(prescription.data.height_cm == null ? "" : String(prescription.data.height_cm));
    setSymptoms(prescription.data.symptoms ?? "");
    setDoctorInstructions(prescription.data.doctor_instructions ?? "");
  }, [prescription.data]);

  async function save() {
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
    const { error: updateError } = await supabase
      .from("prescriptions")
      .update({
        prescription_date: date,
        doctor_name: doctor.trim() || null,
        specialty: specialty.trim() || null,
        notes: notes.trim() || null,
        weight_kg: details.data.weight_kg,
        height_cm: details.data.height_cm,
        symptoms: details.data.symptoms,
        doctor_instructions: details.data.doctor_instructions,
      })
      .eq("id", prescriptionId);
    setBusy(false);
    if (updateError) {
      setError(
        reportError(updateError, {
          fallback: "We couldn't save your changes. Please try again.",
          retry: save,
        }),
      );
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Prescription saved");
    navigate({ to: "/prescriptions/$prescriptionId", params: { prescriptionId }, replace: true });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await save();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/prescriptions/$prescriptionId"
          params={{ prescriptionId }}
          className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to prescription
        </Link>
      </div>

      <section className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
          Update record
        </span>
        <h1 className="text-page-title text-foreground">Edit prescription</h1>
        <p className="text-body max-w-2xl text-muted-foreground">
          Changes to details save when you submit; attachment changes save immediately.
        </p>
      </section>

      {prescription.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-[20px]" />
          <Skeleton className="h-80 rounded-[20px]" />
        </div>
      ) : (
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start"
          onSubmit={handleSubmit}
        >
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
              expandOptional={Boolean(
                prescription.data?.weight_kg != null ||
                prescription.data?.height_cm != null ||
                prescription.data?.symptoms ||
                prescription.data?.doctor_instructions,
              )}
              disabled={busy}
            />

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="hidden items-center gap-3 lg:flex">
              <Button
                type="submit"
                className="h-12 min-w-48 cursor-pointer rounded-full px-6 font-semibold shadow-[0_6px_18px_-4px_rgba(13,94,79,0.28)]"
                disabled={busy}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Saving…" : "Save changes"}
              </Button>
              <Button asChild type="button" variant="ghost" className="h-12 rounded-full px-5">
                <Link to="/prescriptions/$prescriptionId" params={{ prescriptionId }}>
                  Cancel
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {user && (
              <div className="rounded-[20px] border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                <AttachmentManager prescriptionId={prescriptionId} userId={user.id} />
              </div>
            )}

            <div className="flex items-center gap-2.5 rounded-[20px] border border-border/70 bg-secondary/45 p-4">
              <LockKeyhole className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Attachments are stored privately and loaded via time-limited signed URLs.
              </p>
            </div>
          </div>

          <div className="lg:hidden">
            <Button
              type="submit"
              className="h-12 w-full cursor-pointer rounded-full font-semibold shadow-[0_6px_18px_-4px_rgba(13,94,79,0.28)]"
              disabled={busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
