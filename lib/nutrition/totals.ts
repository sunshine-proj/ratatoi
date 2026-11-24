import type { NutritionValues } from "@/lib/ingredients/schema";
import type { PlannedMeal } from "@/lib/planner/schema";

/**
 * Nutrition for planned meals. Values are scaled by planned servings and
 * summed at full precision; round only for display.
 *
 * Missing information is unknown, never zero: a meal whose recipe can't be
 * found has no nutrition, and custom meals may leave carbohydrate or fat
 * blank. Totals report what is known plus how many meals are incomplete.
 */
export type MealNutrition = {
  kcal: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
};

export type NutritionTotals = {
  kcal: number;
  proteinG: number;
  /** Null when any counted meal has unknown carbohydrate. */
  carbsG: number | null;
  /** Null when any counted meal has unknown fat. */
  fatG: number | null;
  mealCount: number;
  /** Meals with no nutrition at all (e.g. a recipe that no longer exists). */
  unknownMeals: number;
};

export type RecipeNutritionLookup = (slug: string) => NutritionValues | undefined;

/** Nutrition for one planned meal at its planned servings, or null if unknown. */
export function plannedMealNutrition(meal: PlannedMeal, lookup: RecipeNutritionLookup): MealNutrition | null {
  const perServing: MealNutrition | undefined =
    meal.kind === "recipe" ? lookup(meal.recipeSlug) : meal.nutritionPerServing;
  if (!perServing) return null;
  const scale = (value: number | null) => (value === null ? null : value * meal.servings);
  return {
    kcal: perServing.kcal * meal.servings,
    proteinG: perServing.proteinG * meal.servings,
    carbsG: scale(perServing.carbsG),
    fatG: scale(perServing.fatG),
  };
}

export function sumNutrition(meals: readonly PlannedMeal[], lookup: RecipeNutritionLookup): NutritionTotals {
  const totals: NutritionTotals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, mealCount: meals.length, unknownMeals: 0 };
  for (const meal of meals) {
    const nutrition = plannedMealNutrition(meal, lookup);
    if (!nutrition) {
      totals.unknownMeals += 1;
      continue;
    }
    totals.kcal += nutrition.kcal;
    totals.proteinG += nutrition.proteinG;
    totals.carbsG = totals.carbsG === null || nutrition.carbsG === null ? null : totals.carbsG + nutrition.carbsG;
    totals.fatG = totals.fatG === null || nutrition.fatG === null ? null : totals.fatG + nutrition.fatG;
  }
  if (totals.unknownMeals > 0) {
    totals.carbsG = null;
    totals.fatG = null;
  }
  return totals;
}

export type DayTotals = { date: string; totals: NutritionTotals };

export type RangeSummary = {
  dates: readonly string[];
  /** Sum over every date in the range. */
  totals: NutritionTotals;
  days: DayTotals[];
  /** Days in the range with at least one planned meal. */
  plannedDays: number;
  /**
   * Average per planned day (days with nothing planned are left out, so an
   * unplanned weekend doesn't halve the average). Null when nothing is planned.
   */
  dailyAverage: Pick<NutritionTotals, "kcal" | "proteinG" | "carbsG" | "fatG"> | null;
};

/** Totals and averages for exactly the given dates (e.g. the selected week). */
export function summarizeRange(
  meals: readonly PlannedMeal[],
  dates: readonly string[],
  lookup: RecipeNutritionLookup,
): RangeSummary {
  const inRange = new Set(dates);
  const selected = meals.filter((meal) => inRange.has(meal.date));
  const days = dates.map((date) => ({
    date,
    totals: sumNutrition(
      selected.filter((meal) => meal.date === date),
      lookup,
    ),
  }));
  const totals = sumNutrition(selected, lookup);
  const plannedDays = days.filter((day) => day.totals.mealCount > 0).length;
  const average = (value: number | null) => (value === null ? null : value / plannedDays);
  return {
    dates,
    totals,
    days,
    plannedDays,
    dailyAverage:
      plannedDays === 0
        ? null
        : {
            kcal: totals.kcal / plannedDays,
            proteinG: totals.proteinG / plannedDays,
            carbsG: average(totals.carbsG),
            fatG: average(totals.fatG),
          },
  };
}
