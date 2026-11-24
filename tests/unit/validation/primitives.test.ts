import { describe, expect, it } from "vitest";
import {
  isoDate,
  minutes,
  nonEmptyText,
  nonNegativeAmount,
  positiveQuantity,
  slug,
} from "@/lib/validation";

describe("nonNegativeAmount", () => {
  it("accepts zero, integers, and decimals", () => {
    for (const value of [0, 20, 12.5]) {
      expect(nonNegativeAmount.safeParse(value).success).toBe(true);
    }
  });

  it("rejects negative and non-finite values", () => {
    for (const value of [-0.1, -5, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(nonNegativeAmount.safeParse(value).success).toBe(false);
    }
  });
});

describe("positiveQuantity", () => {
  it("accepts fractional servings", () => {
    expect(positiveQuantity.safeParse(0.5).success).toBe(true);
  });

  it("rejects zero and negatives", () => {
    expect(positiveQuantity.safeParse(0).success).toBe(false);
    expect(positiveQuantity.safeParse(-1).success).toBe(false);
  });
});

describe("minutes", () => {
  it("accepts whole non-negative minutes", () => {
    expect(minutes.safeParse(0).success).toBe(true);
    expect(minutes.safeParse(15).success).toBe(true);
  });

  it("rejects fractions and negatives", () => {
    expect(minutes.safeParse(2.5).success).toBe(false);
    expect(minutes.safeParse(-1).success).toBe(false);
  });
});

describe("isoDate", () => {
  it("accepts a valid calendar date", () => {
    expect(isoDate.safeParse("2026-11-24").success).toBe(true);
    expect(isoDate.safeParse("2028-02-29").success).toBe(true);
  });

  it("rejects impossible dates, datetimes, and other formats", () => {
    for (const value of ["2026-02-30", "2026-13-01", "2026-11-24T10:00:00Z", "24/11/2026"]) {
      expect(isoDate.safeParse(value).success).toBe(false);
    }
  });
});

describe("slug", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(slug.safeParse("greek-yoghurt-bowl").success).toBe(true);
    expect(slug.safeParse("omelette2").success).toBe(true);
  });

  it("rejects uppercase, spaces, and stray hyphens", () => {
    for (const value of ["Greek-Bowl", "greek bowl", "-bowl", "bowl-", "greek--bowl", ""]) {
      expect(slug.safeParse(value).success).toBe(false);
    }
  });
});

describe("nonEmptyText", () => {
  it("trims surrounding whitespace", () => {
    expect(nonEmptyText.parse("  Eggs ")).toBe("Eggs");
  });

  it("rejects empty and whitespace-only text", () => {
    expect(nonEmptyText.safeParse("").success).toBe(false);
    expect(nonEmptyText.safeParse("   ").success).toBe(false);
  });
});
