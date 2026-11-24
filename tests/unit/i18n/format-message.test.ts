import { describe, expect, it } from "vitest";
import { formatMessage } from "@/lib/i18n";

describe("formatMessage", () => {
  it("fills named placeholders", () => {
    expect(formatMessage("{n} g protein in {meal}", { n: 32, meal: "lunch" })).toBe("32 g protein in lunch");
  });

  it("leaves unknown placeholders visible", () => {
    expect(formatMessage("Hello {name}", {})).toBe("Hello {name}");
  });
});
