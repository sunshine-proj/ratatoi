import { describe, expect, it } from "vitest";
import {
  emptyProfileDraft,
  estimateTargets,
  MIN_SUGGESTED_KCAL,
  parseProfile,
  restingEnergyKcal,
  type Profile,
} from "@/lib/nutrition/estimate";

const base: Profile = { ageYears: 30, sex: "female", heightCm: 165, weightKg: 65, activity: "moderate" };

describe("restingEnergyKcal (Mifflin–St Jeor)", () => {
  it("matches the published formula", () => {
    // 10×65 + 6.25×165 − 5×30 − 161 = 1370.25
    expect(restingEnergyKcal(base)).toBeCloseTo(1370.25, 5);
    // 10×90 + 6.25×180 − 5×40 + 5 = 1830
    expect(restingEnergyKcal({ ageYears: 40, sex: "male", heightCm: 180, weightKg: 90 })).toBeCloseTo(1830, 5);
  });

  it("uses the midpoint constant when sex is not given", () => {
    const female = restingEnergyKcal(base);
    const male = restingEnergyKcal({ ...base, sex: "male" });
    expect(restingEnergyKcal({ ...base, sex: "unspecified" })).toBeCloseTo((female + male) / 2, 5);
  });
});

describe("estimateTargets", () => {
  it("applies a moderate deficit for fat loss and rounds for display", () => {
    const estimate = estimateTargets(base, "fat_loss");
    // maintenance 1370.25 × 1.55 = 2123.9 → 2100; × 0.85 = 1805.3 → 1800
    expect(estimate.maintenanceKcal).toBe(2100);
    expect(estimate.calories).toBe(1800);
    // 65 kg × 1.8 = 117 → 115
    expect(estimate.protein).toBe(115);
    expect(estimate.flooredAtMinimum).toBe(false);
    expect(estimate.proteinCapped).toBe(false);
  });

  it("adds energy for muscle gain", () => {
    const estimate = estimateTargets(
      { ageYears: 40, sex: "male", heightCm: 180, weightKg: 90, activity: "active" },
      "muscle_gain",
    );
    // 1830 × 1.725 = 3156.75; × 1.10 = 3472.4 → 3450
    expect(estimate.calories).toBe(3450);
    expect(estimate.protein).toBe(160); // 90 × 1.8 = 162 → 160
  });

  it("keeps calories at maintenance for higher-protein healthy eating", () => {
    const estimate = estimateTargets(base, "healthy_eating");
    expect(estimate.calories).toBe(2100);
    expect(estimate.protein).toBe(90); // 65 × 1.4 = 91 → 90
  });

  it("never suggests less than the minimum", () => {
    const estimate = estimateTargets(
      { ageYears: 70, sex: "female", heightCm: 150, weightKg: 40, activity: "sedentary" },
      "fat_loss",
    );
    expect(estimate.calories).toBe(MIN_SUGGESTED_KCAL);
    expect(estimate.flooredAtMinimum).toBe(true);
  });

  it("caps protein at 35% of calories for very high body weights", () => {
    const estimate = estimateTargets(
      { ageYears: 60, sex: "female", heightCm: 150, weightKg: 200, activity: "sedentary" },
      "fat_loss",
    );
    expect(estimate.calories).toBe(2550);
    expect(estimate.proteinCapped).toBe(true);
    expect(estimate.protein * 4).toBeLessThanOrEqual(estimate.calories * 0.35);
    expect(estimate.protein).toBe(220);
  });
});

describe("parseProfile", () => {
  const valid = { age: "30", height: "165", weight: "65,5", sex: "female", activity: "moderate" } as const;

  it("parses a complete profile, including a decimal comma", () => {
    expect(parseProfile(valid)).toEqual({
      ok: true,
      value: { ageYears: 30, heightCm: 165, weightKg: 65.5, sex: "female", activity: "moderate" },
    });
  });

  it("requires every field", () => {
    const result = parseProfile(emptyProfileDraft);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["activity", "age", "height", "sex", "weight"]);
  });

  it("explains that estimates are for adults", () => {
    expect(parseProfile({ ...valid, age: "16" })).toEqual({ ok: false, errors: { age: { code: "adultsOnly" } } });
  });

  it("rejects implausible measurements", () => {
    const result = parseProfile({ ...valid, height: "17", weight: "650", age: "130" });
    expect(result).toEqual({
      ok: false,
      errors: {
        age: { code: "outOfRange", min: 18, max: 100 },
        height: { code: "outOfRange", min: 120, max: 230 },
        weight: { code: "outOfRange", min: 35, max: 300 },
      },
    });
  });
});
