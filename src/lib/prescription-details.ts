import { z } from "zod";

const optionalMeasurement = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? null : Number(trimmed);
    },
    z
      .number({ invalid_type_error: `${label} must be a number.` })
      .min(min, `${label} must be at least ${min}.`)
      .max(max, `${label} must be no more than ${max}.`)
      .nullable(),
  );

export const prescriptionDetailsSchema = z.object({
  weight_kg: optionalMeasurement("Weight", 1, 500),
  height_cm: optionalMeasurement("Height", 1, 300),
  symptoms: z
    .string()
    .trim()
    .max(2000, "Symptoms must be 2,000 characters or fewer.")
    .transform((value) => value || null),
  doctor_instructions: z
    .string()
    .trim()
    .max(2000, "What the doctor said must be 2,000 characters or fewer.")
    .transform((value) => value || null),
});

export type PrescriptionDetailsInput = z.input<typeof prescriptionDetailsSchema>;
export type PrescriptionDetailsErrors = Partial<Record<keyof PrescriptionDetailsInput, string>>;

export function validatePrescriptionDetails(input: PrescriptionDetailsInput) {
  const result = prescriptionDetailsSchema.safeParse(input);
  if (result.success) return { success: true as const, data: result.data, errors: {} };

  const errors: PrescriptionDetailsErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (
      field === "weight_kg" || field === "height_cm" ||
      field === "symptoms" || field === "doctor_instructions"
    ) {
      errors[field] = issue.message;
    }
  }
  return { success: false as const, data: null, errors };
}