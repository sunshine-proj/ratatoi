import { describe, expect, it } from "vitest";
import { greetingFor } from "@/components/today/today-dashboard";
import type { DailyTargets } from "@/lib/nutrition/goal";
import { dayProgress, metricProgress } from "@/lib/nutrition/progress";
import { sumNutrition, summarizeRange, type NutritionTotals } from "@/lib/nutrition/totals";
import { addMeal, type NewMeal } from "@/lib/planner/operations";
import { emptyPlan, type MealPlan } from "@/lib/planner/schema";
import { weekDates } from "@/lib/dates";

const targets: DailyTargets = {
  dailyCalorieTargetKcal: 1900,
  dailyProteinTargetG: 150,
  dailyCarbsTargetG: null,
  dailyFatTargetG: null,
};

function totals(overrides: Partial<NutritionTotals>): NutritionTotals {
  return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, mealCount: 0, unknownMeals: 0, ...overrides };
}

/** Custom meals let tests state exact nutrition. */
function custom(name: string, kcal: number, proteinG: number, mealType: NewMeal["mealType"], date = "2026-11-26", servings = 1): NewMeal {
  return { kind: "custom", name, nutritionPerServing: { kcal, proteinG, carbsG: null, fatG: null }, date, mealType, servings };
}

function plan(...meals: NewMeal[]): MealPlan {
  let n = 0;
  const ctx = { now: new Date("2026-11-24T10:00:00Z"), newId: () => `m${++n}` };
  return meals.reduce((p, meal) => addMeal(p, meal, ctx), emptyPlan);
}

const noRecipes = () => undefined;

describe("PRD acceptance scenario", () => {
  it("1,900 kcal / 150 g targets; four meals → 1,700 kcal, 150 g; 200 kcal and 0 g remaining", () => {
    const day = plan(
      custom("Breakfast", 400, 35, "breakfast"),
      custom("Lunch", 550, 45, "lunch"),
      custom("Dinner", 600, 50, "dinner"),
      custom("Snack 1", 150, 20, "snack"),
    );
    const dayTotals = sumNutrition(day.meals, noRecipes);
    expect(dayTotals.kcal).toBe(1700);
    expect(dayTotals.proteinG).toBe(150);

    const [kcal, protein] = dayProgress(dayTotals, targets);
    expect(kcal).toMatchObject({ metric: "kcal", displayPlanned: 1700, displayRemaining: 200, state: "below" });
    expect(protein).toMatchObject({ metric: "proteinG", displayPlanned: 150, displayRemaining: 0, state: "met" });
  });
});

describe("metricProgress", () => {
  it("handles target above, equal to, and below planned intake", () => {
    expect(metricProgress("kcal", 1900, 1700)).toMatchObject({ remaining: 200, state: "below" });
    expect(metricProgress("kcal", 1900, 1900)).toMatchObject({ remaining: 0, state: "met" });
    // Negative remaining is allowed; the UI words it neutrally ("above target").
    expect(metricProgress("kcal", 1900, 2050)).toMatchObject({ remaining: -150, displayRemaining: -150, state: "above" });
  });

  it("keeps full precision but displays numbers that add up", () => {
    const progress = metricProgress("kcal", 1900, 1699.5);
    expect(progress.planned).toBe(1699.5);
    expect(progress.remaining).toBe(200.5);
    // Rounding each independently would show 1,700 + 201 = 1,901.
    expect(progress.displayPlanned! + progress.displayRemaining!).toBe(1900);
    expect(progress.ratio).toBeCloseTo(1699.5 / 1900, 10);
  });

  it("treats unknown planned values as unknown, not zero", () => {
    expect(metricProgress("carbsG", 200, null)).toMatchObject({ planned: null, remaining: null, state: null });
  });

  it("rejects negative values", () => {
    expect(() => metricProgress("kcal", 1900, -1)).toThrow();
  });

  it("reports an empty day as everything remaining", () => {
    expect(metricProgress("proteinG", 150, 0)).toMatchObject({ remaining: 150, state: "below", ratio: 0 });
  });
});

describe("dayProgress", () => {
  it("includes carbohydrate and fat only when those targets are set", () => {
    expect(dayProgress(totals({}), targets).map((p) => p.metric)).toEqual(["kcal", "proteinG"]);
    const withMacros = { ...targets, dailyCarbsTargetG: 180, dailyFatTargetG: 60 };
    expect(dayProgress(totals({ carbsG: 90, fatG: null }), withMacros).map((p) => [p.metric, p.state])).toEqual([
      ["kcal", "below"],
      ["proteinG", "below"],
      ["carbsG", "below"],
      ["fatG", null],
    ]);
  });
});

describe("summarizeRange", () => {
  it("uses only the selected dates and averages over planned days", () => {
    const week = weekDates("2026-11-26"); // 23–29 Nov
    const p = plan(
      custom("Mon", 1800, 140, "lunch", "2026-11-23"),
      custom("Thu", 2000, 160, "lunch", "2026-11-26"),
      custom("Next Monday", 5000, 300, "lunch", "2026-11-30"),
      custom("Previous Sunday", 5000, 300, "lunch", "2026-11-22"),
    );
    const summary = summarizeRange(p.meals, week, noRecipes);
    expect(summary.totals).toMatchObject({ kcal: 3800, proteinG: 300, mealCount: 2 });
    expect(summary.plannedDays).toBe(2);
    expect(summary.dailyAverage).toMatchObject({ kcal: 1900, proteinG: 150 });
    expect(summary.days).toHaveLength(7);
    expect(summary.days.find((d) => d.date === "2026-11-24")?.totals.mealCount).toBe(0);
  });

  it("has no average when nothing is planned", () => {
    const summary = summarizeRange([], weekDates("2026-11-26"), noRecipes);
    expect(summary.dailyAverage).toBeNull();
    expect(summary.plannedDays).toBe(0);
  });

  it("counts fractional servings and multiple snacks", () => {
    const p = plan(custom("Snack A", 100, 10, "snack", "2026-11-26", 1.5), custom("Snack B", 200, 20, "snack", "2026-11-26", 0.5));
    expect(summarizeRange(p.meals, ["2026-11-26"], noRecipes).totals).toMatchObject({ kcal: 250, proteinG: 25 });
  });
});

describe("greeting", () => {
  it("uses the local hour (24-hour clock)", () => {
    expect([0, 11, 12, 17, 18, 23].map(greetingFor)).toEqual(["morning", "morning", "afternoon", "afternoon", "evening", "evening"]);
  });
});
