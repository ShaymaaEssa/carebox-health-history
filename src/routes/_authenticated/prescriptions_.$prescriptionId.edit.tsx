import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AttachmentManager } from "@/components/attachment-manager";
import { PageHeader } from "@/components/page-header";
import { PrescriptionFields } from "@/components/prescription-fields";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { prescriptionQuery } from "@/lib/queries";
import { validatePrescriptionDetails, type PrescriptionDetailsErrors } from "@/lib/prescription-details";
import { useActionError } from "@/lib/use-action-error";

export const Route = createFileRoute("/_authenticated/prescriptions_/$prescriptionId/edit")({
  head: () => ({
    meta: [
      { title: "Edit prescription — CareBox" },
      { name: "description", content: "Update prescription details and manage its attachments." },
      { property: "og:title", content: "Edit prescription — CareBox" },
      { property: "og:description", content: "Update prescription details and manage its attachments." },
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
    <div>
      <PageHeader
        title="Edit prescription"
        subtitle="Changes to details save when you submit; attachment changes save immediately."
        backTo="/prescriptions/$prescriptionId"
        backParams={{ prescriptionId }}
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
          weightKg={weightKg}
          setWeightKg={(value) => { setWeightKg(value); setOptionalErrors((prev) => ({ ...prev, weight_kg: undefined })); }}
          heightCm={heightCm}
          setHeightCm={(value) => { setHeightCm(value); setOptionalErrors((prev) => ({ ...prev, height_cm: undefined })); }}
          symptoms={symptoms}
          setSymptoms={(value) => { setSymptoms(value); setOptionalErrors((prev) => ({ ...prev, symptoms: undefined })); }}
          doctorInstructions={doctorInstructions}
          setDoctorInstructions={(value) => { setDoctorInstructions(value); setOptionalErrors((prev) => ({ ...prev, doctor_instructions: undefined })); }}
          optionalErrors={optionalErrors}
          expandOptional={Boolean(
            prescription.data?.weight_kg != null || prescription.data?.height_cm != null ||
            prescription.data?.symptoms || prescription.data?.doctor_instructions,
          )}
          disabled={busy}
        />

        {user && <div className="form-surface"><AttachmentManager prescriptionId={prescriptionId} userId={user.id} /></div>}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="h-12 w-full sm:w-auto sm:min-w-48" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
