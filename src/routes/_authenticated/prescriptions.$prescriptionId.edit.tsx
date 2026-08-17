import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AttachmentManager } from "@/components/attachment-manager";
import { PageHeader } from "@/components/page-header";
import { PrescriptionFields } from "@/components/prescription-fields";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { prescriptionQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/prescriptions/$prescriptionId/edit")({
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
  const { user } = useAuth();
  const prescription = useQuery(prescriptionQuery(prescriptionId));

  const [date, setDate] = useState("");
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prescription.data) return;
    setDate(prescription.data.prescription_date.slice(0, 10));
    setDoctor(prescription.data.doctor_name ?? "");
    setSpecialty(prescription.data.specialty ?? "");
    setNotes(prescription.data.notes ?? "");
  }, [prescription.data]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("prescriptions")
      .update({
        prescription_date: date,
        doctor_name: doctor.trim() || null,
        specialty: specialty.trim() || null,
        notes: notes.trim() || null,
      })
      .eq("id", prescriptionId);
    setBusy(false);
    if (updateError) {
      setError("We couldn't save your changes. Please try again.");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Prescription updated");
    navigate({ to: "/prescriptions/$prescriptionId", params: { prescriptionId }, replace: true });
  }

  return (
    <div>
      <PageHeader
        title="Edit prescription"
        backTo="/prescriptions/$prescriptionId"
        backParams={{ prescriptionId }}
      />
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

        {user && <AttachmentManager prescriptionId={prescriptionId} userId={user.id} />}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
