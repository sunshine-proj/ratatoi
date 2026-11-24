import { describe, expect, it } from "vitest";
import { nextServings } from "@/components/planner/servings-stepper";
import { addDays, daysBetween, isIsoDate, startOfWeek, toLocalIsoDate, weekDates } from "@/lib/dates";
import { plannedMealNutrition, sumNutrition } from "@/lib/nutrition/totals";
import { parseCustomMeal } from "@/lib/planner/custom-meal-form";
import {
  addMeal,
  clearDates,
  countMealsOn,
  duplicateMeal,
  mealsInSlot,
  mealsOn,
  moveMeal,
  removeMeal,
  replaceMeal,
  restoreMeal,
  setServings,
  type NewMeal,
  type OpContext,
} from "@/lib/planner/operations";
import { emptyPlan, mealPlanSchema, servingsSchema, type MealPlan } from "@/lib/planner/schema";

function context(): OpContext {
  let n = 0;
  return { now: new Date("2026-11-24T10:00:00Z"), newId: () => `meal-${++n}` };
}

const recipe = (slug: string, date = "2026-11-26", mealType: NewMeal["mealType"] = "lunch", servings = 1): NewMeal => ({
  kind: "recipe",
  recipeSlug: slug,
  date,
  mealType,
  servings,
});

function build(...meals: NewMeal[]): MealPlan {
  const ctx = context();
  return meals.reduce((plan, meal) => addMeal(plan, meal, ctx), emptyPlan);
}

const slugs = (plan: MealPlan, date: string, mealType: NewMeal["mealType"]) =>
  mealsInSlot(plan, date, mealType).map((m) => (m.kind === "recipe" ? m.recipeSlug : m.name));

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-11-24T00:00")).toBe(false);
  });

  it("starts weeks on Monday", () => {
    expect(startOfWeek("2026-11-26")).toBe("2026-11-23"); // Thursday → Monday
    expect(startOfWeek("2026-11-23")).toBe("2026-11-23"); // Monday stays
    expect(startOfWeek("2026-11-29")).toBe("2026-11-23"); // Sunday → previous Monday
    expect(weekDates("2026-12-31")).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  it("is unaffected by daylight-saving changes", () => {
    // EU clocks change on 29 March and 25 October 2026.
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-25", -1)).toBe("2026-10-24");
    expect(daysBetween("2026-03-23", "2026-03-30")).toBe(7);
  });

  it("reads today from the local clock", () => {
    expect(toLocalIsoDate(new Date(2026, 10, 24, 23, 59))).toBe("2026-11-24");
  });
});

describe("planner operations", () => {
  it("adds meals to the end of their slot, with any number of snacks", () => {
    const plan = build(recipe("a", "2026-11-26", "snack"), recipe("b", "2026-11-26", "snack"), recipe("c", "2026-11-26", "snack"));
    expect(slugs(plan, "2026-11-26", "snack")).toEqual(["a", "b", "c"]);
    expect(mealsInSlot(plan, "2026-11-26", "snack").map((m) => m.position)).toEqual([0, 1, 2]);
    expect(mealPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("never mutates the input plan", () => {
    const plan = build(recipe("a"));
    const snapshot = JSON.stringify(plan);
    removeMeal(plan, "meal-1");
    setServings(plan, "meal-1", 2, context());
    addMeal(plan, recipe("b"), context());
    expect(JSON.stringify(plan)).toBe(snapshot);
  });

  it("orders a day breakfast → lunch → dinner → snacks", () => {
    const plan = build(recipe("snack", "2026-11-26", "snack"), recipe("dinner", "2026-11-26", "dinner"), recipe("bf", "2026-11-26", "breakfast"));
    expect(mealsOn(plan, "2026-11-26").map((m) => m.mealType)).toEqual(["breakfast", "dinner", "snack"]);
  });

  it("removes a meal and closes the gap", () => {
    const plan = removeMeal(build(recipe("a"), recipe("b"), recipe("c")), "meal-2");
    expect(slugs(plan, "2026-11-26", "lunch")).toEqual(["a", "c"]);
    expect(mealsInSlot(plan, "2026-11-26", "lunch").map((m) => m.position)).toEqual([0, 1]);
    expect(removeMeal(plan, "missing")).toBe(plan);
  });

  it("restores a removed meal to its old place (undo)", () => {
    const plan = build(recipe("a"), recipe("b"), recipe("c"));
    const removed = plan.meals.find((m) => m.id === "meal-2")!;
    const restored = restoreMeal(removeMeal(plan, "meal-2"), removed);
    expect(slugs(restored, "2026-11-26", "lunch")).toEqual(["a", "b", "c"]);
    expect(restoreMeal(plan, removed)).toBe(plan); // already present
  });

  it("replaces a meal in place, keeping its id, slot, position, and servings", () => {
    const plan = setServings(build(recipe("a"), recipe("b")), "meal-1", 1.5, context());
    const swapped = replaceMeal(plan, "meal-1", { kind: "recipe", recipeSlug: "z" }, context());
    const meal = swapped.meals.find((m) => m.id === "meal-1")!;
    expect(meal).toMatchObject({ kind: "recipe", recipeSlug: "z", servings: 1.5, position: 0, mealType: "lunch" });
    expect(slugs(swapped, "2026-11-26", "lunch")).toEqual(["z", "b"]);
  });

  it("can replace a recipe with a custom meal", () => {
    const plan = replaceMeal(build(recipe("a")), "meal-1", {
      kind: "custom",
      name: "  Canteen lunch ",
      nutritionPerServing: { kcal: 600, proteinG: 35, carbsG: null, fatG: null },
    }, context());
    expect(plan.meals[0]).toMatchObject({ kind: "custom", name: "Canteen lunch" });
    expect(plan.meals[0]).not.toHaveProperty("recipeSlug");
  });

  it("duplicates to another day and meal, keeping servings", () => {
    const ctx = context();
    let plan = addMeal(emptyPlan, recipe("a", "2026-11-26", "lunch", 2), ctx);
    plan = duplicateMeal(plan, "meal-1", { date: "2026-11-27", mealType: "dinner" }, ctx);
    expect(slugs(plan, "2026-11-27", "dinner")).toEqual(["a"]);
    expect(mealsInSlot(plan, "2026-11-27", "dinner")[0]).toMatchObject({ servings: 2, id: "meal-2" });
    expect(countMealsOn(plan, ["2026-11-26", "2026-11-27"])).toBe(2);
  });

  it("reorders within a slot and ignores moves past the edges", () => {
    const plan = build(recipe("a"), recipe("b"), recipe("c"));
    expect(slugs(moveMeal(plan, "meal-3", "up"), "2026-11-26", "lunch")).toEqual(["a", "c", "b"]);
    expect(slugs(moveMeal(plan, "meal-1", "down"), "2026-11-26", "lunch")).toEqual(["b", "a", "c"]);
    expect(moveMeal(plan, "meal-1", "up")).toBe(plan);
    expect(moveMeal(plan, "meal-3", "down")).toBe(plan);
  });

  it("changes servings", () => {
    const plan = setServings(build(recipe("a")), "meal-1", 0.5, context());
    expect(plan.meals[0]?.servings).toBe(0.5);
  });

  it("clears a day or a whole week, leaving other dates alone", () => {
    const plan = build(recipe("a", "2026-11-23"), recipe("b", "2026-11-29"), recipe("c", "2026-11-30"));
    expect(clearDates(plan, ["2026-11-23"]).meals.map((m) => m.date)).toEqual(["2026-11-29", "2026-11-30"]);
    expect(clearDates(plan, weekDates("2026-11-26")).meals.map((m) => m.date)).toEqual(["2026-11-30"]);
  });

  it("rejects invalid servings and duplicate ids", () => {
    expect(servingsSchema.safeParse(0).success).toBe(false);
    expect(servingsSchema.safeParse(0.3).success).toBe(false);
    expect(servingsSchema.safeParse(20.25).success).toBe(false);
    expect(servingsSchema.safeParse(1.75).success).toBe(true);
    const plan = build(recipe("a"));
    expect(mealPlanSchema.safeParse({ ...plan, meals: [...plan.meals, plan.meals[0]] }).success).toBe(false);
  });
});

describe("planned nutrition", () => {
  const lookup = (slug: string) =>
    ({
      bowl: { kcal: 400, proteinG: 35, carbsG: 30, fatG: 12 },
      snack: { kcal: 150, proteinG: 20, carbsG: 10, fatG: 3 },
    })[slug];

  it("scales by servings, including fractions", () => {
    const [meal] = build(recipe("bowl", "2026-11-26", "lunch", 1.5)).meals;
    expect(plannedMealNutrition(meal!, lookup)).toEqual({ kcal: 600, proteinG: 52.5, carbsG: 45, fatG: 18 });
  });

  it("sums a day with multiple snacks", () => {
    const plan = build(recipe("bowl"), recipe("snack", "2026-11-26", "snack"), recipe("snack", "2026-11-26", "snack"));
    expect(sumNutrition(mealsOn(plan, "2026-11-26"), lookup)).toEqual({
      kcal: 700,
      proteinG: 75,
      carbsG: 50,
      fatG: 18,
      mealCount: 3,
      unknownMeals: 0,
    });
  });

  it("is zero for an empty day", () => {
    expect(sumNutrition([], lookup)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, mealCount: 0, unknownMeals: 0 });
  });

  it("treats missing information as unknown, not zero", () => {
    const ctx = context();
    let plan = addMeal(emptyPlan, recipe("bowl"), ctx);
    plan = addMeal(plan, recipe("deleted-recipe"), ctx);
    plan = addMeal(plan, {
      kind: "custom",
      name: "Canteen",
      nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: null, fatG: 20 },
      date: "2026-11-26",
      mealType: "dinner",
      servings: 1,
    }, ctx);
    const totals = sumNutrition(mealsOn(plan, "2026-11-26"), lookup);
    expect(totals).toMatchObject({ kcal: 900, proteinG: 65, carbsG: null, fatG: null, unknownMeals: 1, mealCount: 3 });
    expect(plannedMealNutrition(plan.meals.find((m) => m.kind === "recipe" && m.recipeSlug === "deleted-recipe")!, lookup)).toBeNull();
  });
});

describe("custom meal form", () => {
  it("requires a name, calories, and protein; carbs and fat are optional", () => {
    expect(parseCustomMeal({ name: " Canteen  lunch ", kcal: "650", protein: "40,5", carbs: "", fat: "" })).toEqual({
      ok: true,
      value: { name: "Canteen lunch", nutritionPerServing: { kcal: 650, proteinG: 40.5, carbsG: null, fatG: null } },
    });
    expect(parseCustomMeal({ name: "", kcal: "", protein: "x", carbs: "-1", fat: "" })).toEqual({
      ok: false,
      errors: {
        name: { code: "required" },
        kcal: { code: "required" },
        protein: { code: "notANumber" },
        carbs: { code: "outOfRange", min: 0, max: 1000 },
      },
    });
    expect(parseCustomMeal({ name: "x".repeat(81), kcal: "1", protein: "1", carbs: "", fat: "" })).toMatchObject({
      ok: false,
      errors: { name: { code: "tooLong", max: 80 } },
    });
  });
});

describe("servings stepper steps", () => {
  it("uses quarter steps up to 1 and half steps above", () => {
    expect(nextServings(1, 1)).toBe(1.5);
    expect(nextServings(1.5, -1)).toBe(1);
    expect(nextServings(1, -1)).toBe(0.75);
    expect(nextServings(0.25, -1)).toBe(0.25);
    expect(nextServings(0.75, 1)).toBe(1);
    expect(nextServings(20, 1)).toBe(20);
  });
});
