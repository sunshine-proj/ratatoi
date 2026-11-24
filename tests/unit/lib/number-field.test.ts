import { describe, expect, it } from "vitest";
import { numberToInput, parseNumberField } from "@/lib/forms/number-field";

const range = { min: 0, max: 5000 };

describe("parseNumberField", () => {
  it("parses plain integers and decimals", () => {
    expect(parseNumberField("150", range)).toEqual({ ok: true, value: 150 });
    expect(parseNumberField("72.5", range)).toEqual({ ok: true, value: 72.5 });
  });

  it("accepts a decimal comma (EU style)", () => {
    expect(parseNumberField("72,5", range)).toEqual({ ok: true, value: 72.5 });
  });

  it("accepts grouped thousands with commas or spaces", () => {
    expect(parseNumberField("1,900", range)).toEqual({ ok: true, value: 1900 });
    expect(parseNumberField("1 900", range)).toEqual({ ok: true, value: 1900 });
    expect(parseNumberField("1 900", range)).toEqual({ ok: true, value: 1900 });
  });

  it("trims whitespace", () => {
    expect(parseNumberField("  42 ", range)).toEqual({ ok: true, value: 42 });
  });

  it("treats empty input as null when optional and as an error when required", () => {
    expect(parseNumberField("", range)).toEqual({ ok: true, value: null });
    expect(parseNumberField("   ", { ...range, required: true })).toEqual({ ok: false, error: { code: "required" } });
  });

  it("rejects text that is not a number", () => {
    for (const raw of ["abc", "12kg", "1..2", "1,2,3", "--1"]) {
      expect(parseNumberField(raw, range), raw).toEqual({ ok: false, error: { code: "notANumber" } });
    }
  });

  it("enforces whole numbers when asked", () => {
    expect(parseNumberField("150.5", { ...range, integer: true })).toEqual({ ok: false, error: { code: "notWholeNumber" } });
  });

  it("uses inclusive bounds", () => {
    expect(parseNumberField("0", range)).toEqual({ ok: true, value: 0 });
    expect(parseNumberField("5000", range)).toEqual({ ok: true, value: 5000 });
    expect(parseNumberField("5001", range)).toEqual({ ok: false, error: { code: "outOfRange", min: 0, max: 5000 } });
    expect(parseNumberField("-1", range)).toEqual({ ok: false, error: { code: "outOfRange", min: 0, max: 5000 } });
  });

  it("round-trips stored values to inputs", () => {
    expect(numberToInput(null)).toBe("");
    expect(numberToInput(undefined)).toBe("");
    expect(numberToInput(0)).toBe("0");
  });
});
