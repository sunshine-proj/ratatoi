import { describe, expect, it } from "vitest";
import {
  buildGoal,
  macroEnergyKcal,
  nutritionGoalSchema,
  parseTargets,
  targetNotices,
  targetsToDraft,
  type DailyTargets,
} from "@/lib/nutrition/goal";

const targets: DailyTargets = {
  dailyCalorieTargetKcal: 1900,
  dailyProteinTargetG: 150,
  dailyCarbsTargetG: null,
  dailyFatTargetG: null,
};

describe("parseTargets", () => {
  it("requires calories and protein; carbs and fat are optional", () => {
    expect(parseTargets({ calories: "1900", protein: "150", carbs: "", fat: "" })).toEqual({ ok: true, value: targets });
  });

  it("reports every invalid field at once", () => {
    const result = parseTargets({ calories: "", protein: "15", carbs: "abc", fat: "60.5" });
    expect(result).toEqual({
      ok: false,
      errors: {
        calories: { code: "required" },
        protein: { code: "outOfRange", min: 20, max: 400 },
        carbs: { code: "notANumber" },
        fat: { code: "notWholeNumber" },
      },
    });
  });

  it("rejects typo-sized calorie targets", () => {
    const result = parseTargets({ calories: "19000", protein: "150", carbs: "", fat: "" });
    expect(result.ok).toBe(false);
  });

  it("accepts optional macros, including zero", () => {
    const result = parseTargets({ calories: "2,000", protein: "160", carbs: "0", fat: "70" });
    expect(result).toEqual({
      ok: true,
      value: { dailyCalorieTargetKcal: 2000, dailyProteinTargetG: 160, dailyCarbsTargetG: 0, dailyFatTargetG: 70 },
    });
  });

  it("round-trips through the draft form", () => {
    expect(parseTargets(targetsToDraft({ ...targets, dailyFatTargetG: 60 }))).toEqual({
      ok: true,
      value: { ...targets, dailyFatTargetG: 60 },
    });
    expect(targetsToDraft(null)).toEqual({ calories: "", protein: "", carbs: "", fat: "" });
  });
});

describe("buildGoal", () => {
  it("produces a schema-valid goal with timestamps", () => {
    const goal = buildGoal({
      goalType: "fat_loss",
      targets,
      targetSource: "manual",
      effectiveFrom: "2026-11-24",
      now: new Date("2026-11-24T09:30:00Z"),
    });
    expect(nutritionGoalSchema.safeParse(goal).success).toBe(true);
    expect(goal.updatedAt).toBe("2026-11-24T09:30:00.000Z");
  });

  it("refuses invalid values rather than storing them", () => {
    expect(() =>
      buildGoal({
        goalType: "fat_loss",
        targets: { ...targets, dailyProteinTargetG: -5 },
        targetSource: "manual",
        effectiveFrom: "2026-11-24",
      }),
    ).toThrow();
  });
});

describe("notices", () => {
  it("computes macro energy at 4/4/9 kcal per gram", () => {
    expect(macroEnergyKcal({ dailyProteinTargetG: 150, dailyCarbsTargetG: 200, dailyFatTargetG: 60 })).toBe(1940);
    expect(macroEnergyKcal({ dailyProteinTargetG: 150, dailyCarbsTargetG: null, dailyFatTargetG: null })).toBe(600);
  });

  it("flags low calorie targets gently, without blocking them", () => {
    expect(targetNotices({ ...targets, dailyCalorieTargetKcal: 1100 }).lowCalories).toBe(true);
    expect(targetNotices({ ...targets, dailyCalorieTargetKcal: 1200 }).lowCalories).toBe(false);
  });

  it("flags macros that clearly exceed the calorie target", () => {
    const over = targetNotices({ ...targets, dailyCarbsTargetG: 250, dailyFatTargetG: 80 }); // 600+1000+720
    expect(over.macroEnergyOverCalories).toBe(2320);
    const within = targetNotices({ ...targets, dailyCarbsTargetG: 200, dailyFatTargetG: 60 }); // 1940 ≤ 2090
    expect(within.macroEnergyOverCalories).toBeNull();
  });
});
