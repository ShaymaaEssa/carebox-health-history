import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prescriptionDetailsSchema } from "./prescription-details";

const validEmptyDetails = { weight_kg: "", height_cm: "", symptoms: "", doctor_instructions: "" };

describe("optional prescription details", () => {
  it("converts empty measurements and text to null", () => {
    assert.deepEqual(prescriptionDetailsSchema.parse(validEmptyDetails), {
      weight_kg: null,
      height_cm: null,
      symptoms: null,
      doctor_instructions: null,
    });
  });

  it("accepts weight from 1 through 500 kg", () => {
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "1" }).success, true);
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "500" }).success, true);
  });

  it("rejects weight below 1 or above 500 kg", () => {
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "0" }).success, false);
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, weight_kg: "501" }).success, false);
  });

  it("accepts height from 1 through 300 cm", () => {
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "1" }).success, true);
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "300" }).success, true);
  });

  it("rejects height below 1 or above 300 cm", () => {
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "0" }).success, false);
    assert.equal(prescriptionDetailsSchema.safeParse({ ...validEmptyDetails, height_cm: "301" }).success, false);
  });
});