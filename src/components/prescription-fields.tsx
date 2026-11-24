import { Calendar, ChevronDown, FileHeart, Stethoscope, Tag } from "lucide-react";
import { useEffect, useState } from "react";

import { FormIntro } from "@/components/form-intro";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OptionalFieldError = Partial<
  Record<"weight_kg" | "height_cm" | "symptoms" | "doctor_instructions", string>
>;

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
    date,
    setDate,
    doctor,
    setDoctor,
    specialty,
    setSpecialty,
    notes,
    setNotes,
    weightKg,
    setWeightKg,
    heightCm,
    setHeightCm,
    symptoms,
    setSymptoms,
    doctorInstructions,
    setDoctorInstructions,
    optionalErrors = {},
    expandOptional,
    disabled,
  } = props;
  const [optionalOpen, setOptionalOpen] = useState(false);
  const hasOptionalDetails = Boolean(
    weightKg.trim() || heightCm.trim() || symptoms.trim() || doctorInstructions.trim(),
  );

  useEffect(() => {
    if (expandOptional) setOptionalOpen(true);
  }, [expandOptional]);

  return (
    <div className="form-surface grid gap-5 rounded-[20px] sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormIntro
          icon={FileHeart}
          label="Consultation details"
          detail="Keep the visit information alongside the original prescription document."
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="date">Date of visit</Label>
        <div className="relative">
          <Calendar className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="date"
            type="date"
            required
            disabled={disabled}
            className="h-12 w-full rounded-xl bg-muted/40 pl-10 tabular-nums"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="specialty">Specialty</Label>
        <div className="relative">
          <Tag className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="specialty"
            disabled={disabled}
            placeholder="e.g. Pediatrics, Cardiology"
            className="h-12 w-full rounded-xl bg-muted/40 pl-10"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>
      </div>

      <div className="min-w-0 space-y-2 sm:col-span-2">
        <Label htmlFor="doctor">Prescribing doctor</Label>
        <div className="relative">
          <Stethoscope className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="doctor"
            disabled={disabled}
            placeholder="Dr. Sarah Jenkins"
            className="h-12 w-full rounded-xl bg-muted/40 pl-10"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
          />
        </div>
      </div>

      <div className="min-w-0 space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          disabled={disabled}
          placeholder="Medications, dosages, or pharmacy notes..."
          className="rounded-xl bg-muted/40"
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
              className="h-auto w-full cursor-pointer justify-between rounded-2xl border border-border/70 bg-muted/45 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50"
              disabled={disabled}
              aria-expanded={optionalOpen}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  More details (optional)
                  {hasOptionalDetails && !optionalOpen && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label="Contains saved details"
                    />
                  )}
                </span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Weight, height, symptoms, what the doctor said
                </span>
              </span>
              <ChevronDown
                className={`ml-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  optionalOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="grid gap-5 px-1 pt-4 pb-1 sm:grid-cols-2">
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
                className="h-12 w-full rounded-xl bg-muted/40 tabular-nums"
                value={weightKg}
                disabled={disabled}
                aria-invalid={Boolean(optionalErrors.weight_kg)}
                aria-describedby={optionalErrors.weight_kg ? "weight-kg-error" : undefined}
                onChange={(e) => setWeightKg(e.target.value)}
              />
              {optionalErrors.weight_kg && (
                <p id="weight-kg-error" className="text-sm text-destructive">
                  {optionalErrors.weight_kg}
                </p>
              )}
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
                className="h-12 w-full rounded-xl bg-muted/40 tabular-nums"
                value={heightCm}
                disabled={disabled}
                aria-invalid={Boolean(optionalErrors.height_cm)}
                aria-describedby={optionalErrors.height_cm ? "height-cm-error" : undefined}
                onChange={(e) => setHeightCm(e.target.value)}
              />
              {optionalErrors.height_cm && (
                <p id="height-cm-error" className="text-sm text-destructive">
                  {optionalErrors.height_cm}
                </p>
              )}
            </div>

            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                rows={3}
                maxLength={2000}
                disabled={disabled}
                className="rounded-xl bg-muted/40"
                value={symptoms}
                aria-invalid={Boolean(optionalErrors.symptoms)}
                aria-describedby={optionalErrors.symptoms ? "symptoms-error" : undefined}
                onChange={(e) => setSymptoms(e.target.value)}
              />
              {optionalErrors.symptoms && (
                <p id="symptoms-error" className="text-sm text-destructive">
                  {optionalErrors.symptoms}
                </p>
              )}
            </div>

            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="doctor-instructions">What the doctor said</Label>
              <Textarea
                id="doctor-instructions"
                rows={3}
                maxLength={2000}
                disabled={disabled}
                className="rounded-xl bg-muted/40"
                value={doctorInstructions}
                aria-invalid={Boolean(optionalErrors.doctor_instructions)}
                aria-describedby={
                  optionalErrors.doctor_instructions ? "doctor-instructions-error" : undefined
                }
                onChange={(e) => setDoctorInstructions(e.target.value)}
              />
              {optionalErrors.doctor_instructions && (
                <p id="doctor-instructions-error" className="text-sm text-destructive">
                  {optionalErrors.doctor_instructions}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
