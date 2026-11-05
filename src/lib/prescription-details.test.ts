import { describe, expect, test } from "bun:test";
import { prescriptionDetailsSchema } from "./prescription-details";

const validEmptyDetails = { weight_kg: "", height_cm: "", symptoms: "", doctor_instructions: "" };

describe("optional prescription details", () => {
  test("converts empty measurements and text to null", () => {
    expect(prescriptionDetailsSchema.parse(validEmptyDetails)).toEqual({
      weight_kg: null,
      height_cm: null,
      symptoms: null,
      doctor_instructions: null,
    });
  });

  test("accepts weight values from 1 through 500 kg", () => {
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "1" }).success).toBe(true);
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "500" }).success).toBe(true);
  });

  test("rejects weight values below 1 or above 500 kg", () => {
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "0" }).success).toBe(false);
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "501" }).success).toBe(false);
  });

  test("accepts height values from 1 through 300 cm", () => {
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "1" }).success).toBe(true);
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "300" }).success).toBe(true);
  });

  test("rejects height values below 1 or above 300 cm", () => {
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "0" }).success).toBe(false);
    expect(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "301" }).success).toBe(false);
  });
});