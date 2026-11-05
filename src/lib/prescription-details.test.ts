import { prescriptionDetailsSchema } from "./prescription-details";

const validEmptyDetails = { weight_kg: "", height_cm: "", symptoms: "", doctor_instructions: "" };

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertParsed(input: typeof validEmptyDetails & { weight_kg?: string; height_cm?: string }, expected: unknown, message: string) {
  const result = prescriptionDetailsSchema.safeParse(input);
  assert(result.success, `${message}: expected valid values`);
  assert(JSON.stringify(result.data) === JSON.stringify(expected), `${message}: unexpected normalized values`);
}

function assertInvalid(input: typeof validEmptyDetails & { weight_kg?: string; height_cm?: string }, message: string) {
  assert(!prescriptionDetailsSchema.safeParse(input).success, message);
}

assertParsed(validEmptyDetails, {
      weight_kg: null,
      height_cm: null,
      symptoms: null,
      doctor_instructions: null,
    }, "empty values normalize to null");

assertParsed({ ...validEmptyDetails, weight_kg: "1" }, { weight_kg: 1, height_cm: null, symptoms: null, doctor_instructions: null }, "minimum weight is accepted");
assertParsed({ ...validEmptyDetails, weight_kg: "500" }, { weight_kg: 500, height_cm: null, symptoms: null, doctor_instructions: null }, "maximum weight is accepted");
assertInvalid({ ...validEmptyDetails, weight_kg: "0" }, "weight below 1 kg is rejected");
assertInvalid({ ...validEmptyDetails, weight_kg: "501" }, "weight above 500 kg is rejected");
assertParsed({ ...validEmptyDetails, height_cm: "1" }, { weight_kg: null, height_cm: 1, symptoms: null, doctor_instructions: null }, "minimum height is accepted");
assertParsed({ ...validEmptyDetails, height_cm: "300" }, { weight_kg: null, height_cm: 300, symptoms: null, doctor_instructions: null }, "maximum height is accepted");
assertInvalid({ ...validEmptyDetails, height_cm: "0" }, "height below 1 cm is rejected");
assertInvalid({ ...validEmptyDetails, height_cm: "301" }, "height above 300 cm is rejected");

console.log("Prescription detail validation checks passed.");