import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormIntro } from "@/components/form-intro";
import { ChevronDown, FileHeart } from "lucide-react";

type OptionalFieldError = Partial<Record<"weight_kg" | "height_cm" | "symptoms" | "doctor_instructions", string>>;

export function PrescriptionFields(props: {
  date: string;
  setDate: (v: string) => void;
  doctor: string;
  setDoctor: (v: string) => void;
  specialty: string;
  setSpecialty: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  weightKg: string;
  setWeightKg: (v: string) => void;
  heightCm: string;
  setHeightCm: (v: string) => void;
  symptoms: string;
  setSymptoms: (v: string) => void;
  doctorInstructions: string;
  setDoctorInstructions: (v: string) => void;
  optionalErrors?: OptionalFieldError;
  expandOptional?: boolean;
  disabled?: boolean;
}) {
  const {
    date, setDate, doctor, setDoctor, specialty, setSpecialty, notes, setNotes,
    weightKg, setWeightKg, heightCm, setHeightCm, symptoms, setSymptoms,
    doctorInstructions, setDoctorInstructions, optionalErrors = {}, expandOptional, disabled,
  } = props;
  const [optionalOpen, setOptionalOpen] = useState(false);
  const hasOptionalDetails = Boolean(
    weightKg.trim() || heightCm.trim() || symptoms.trim() || doctorInstructions.trim(),
  );

  useEffect(() => {
    if (expandOptional) setOptionalOpen(true);
  }, [expandOptional]);

  return (
    <div className="form-surface grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><FormIntro icon={FileHeart} label="Prescription details" detail="Keep the visit information with the original document." /></div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          required
          disabled={disabled}
          className="h-12 w-full"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="doctor">Doctor</Label>
        <Input
          id="doctor"
          disabled={disabled}
          className="h-12 w-full"
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
        />
      </div>
      <div className="min-w-0 space-y-2 sm:col-span-2">
        <Label htmlFor="specialty">Specialty</Label>
        <Input
          id="specialty"
          disabled={disabled}
          className="h-12 w-full"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
      </div>
      <div className="min-w-0 space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          disabled={disabled}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between px-3 py-3 text-left hover:bg-secondary/50"
              disabled={disabled}
              aria-expanded={optionalOpen}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-card-title text-foreground">
                  More details (optional)
                  {hasOptionalDetails && !optionalOpen && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Contains saved details" />
                  )}
                </span>
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  Weight, height, symptoms, what the doctor said
                </span>
              </span>
              <ChevronDown className={`ml-3 h-4 w-4 shrink-0 transition-transform ${optionalOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="grid gap-5 px-1 pb-1 pt-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <div>
                <Label htmlFor="weight-kg">Weight (kg)</Label>
                <p className="text-meta">Measured at this visit</p>
              </div>
              <Input
                id="weight-kg"
                type="number"
                inputMode="decimal"
                step="any"
                className="h-12 w-full"
                value={weightKg}
                disabled={disabled}
                aria-invalid={Boolean(optionalErrors.weight_kg)}
                aria-describedby={optionalErrors.weight_kg ? "weight-kg-error" : undefined}
                onChange={(e) => setWeightKg(e.target.value)}
              />
              {optionalErrors.weight_kg && <p id="weight-kg-error" className="text-sm text-destructive">{optionalErrors.weight_kg}</p>}
            </div>
            <div className="min-w-0 space-y-2">
              <div>
                <Label htmlFor="height-cm">Height (cm)</Label>
                <p className="text-meta">Measured at this visit</p>
              </div>
              <Input
                id="height-cm"
                type="number"
                inputMode="decimal"
                step="any"
                className="h-12 w-full"
                value={heightCm}
                disabled={disabled}
                aria-invalid={Boolean(optionalErrors.height_cm)}
                aria-describedby={optionalErrors.height_cm ? "height-cm-error" : undefined}
                onChange={(e) => setHeightCm(e.target.value)}
              />
              {optionalErrors.height_cm && <p id="height-cm-error" className="text-sm text-destructive">{optionalErrors.height_cm}</p>}
            </div>
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                rows={3}
                maxLength={2000}
                disabled={disabled}
                value={symptoms}
                aria-invalid={Boolean(optionalErrors.symptoms)}
                aria-describedby={optionalErrors.symptoms ? "symptoms-error" : undefined}
                onChange={(e) => setSymptoms(e.target.value)}
              />
              {optionalErrors.symptoms && <p id="symptoms-error" className="text-sm text-destructive">{optionalErrors.symptoms}</p>}
            </div>
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="doctor-instructions">What the doctor said</Label>
              <Textarea
                id="doctor-instructions"
                rows={3}
                maxLength={2000}
                disabled={disabled}
                value={doctorInstructions}
                aria-invalid={Boolean(optionalErrors.doctor_instructions)}
                aria-describedby={optionalErrors.doctor_instructions ? "doctor-instructions-error" : undefined}
                onChange={(e) => setDoctorInstructions(e.target.value)}
              />
              {optionalErrors.doctor_instructions && <p id="doctor-instructions-error" className="text-sm text-destructive">{optionalErrors.doctor_instructions}</p>}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
