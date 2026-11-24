import type { NutritionValues } from "@/lib/ingredients/schema";
import type { DietaryPattern } from "@/lib/preferences/preferences";
import type { MealType } from "./schema";

/**
 * Card labels. Every label has a stated, testable threshold, shown to users
 * on the recipe page, so nothing is called "low calorie" on vibes.
 */

/** "High protein": at least 20% of energy from protein (the EU Regulation 1924/2006 condition for the claim). */
export const HIGH_PROTEIN_MIN_ENERGY_SHARE = 0.2;
/** Snacks at or under this energy per serving get an "Under 200 kcal" label. */
export const SNACK_KCAL_LABEL_MAX = 200;
/** Breakfasts, lunches, and dinners at or under this get an "Under 450 kcal" label. */
export const MEAL_KCAL_LABEL_MAX = 450;
/** Total time (prep + cook) for the "Quick" label. */
export const QUICK_MAX_MINUTES = 15;

export const recipeTags = [
  "high_protein",
  "under_200_kcal",
  "under_450_kcal",
  "quick",
  "batch_friendly",
  "vegan",
  "vegetarian",
] as const;
export type RecipeTag = (typeof recipeTags)[number];

export function proteinEnergyShare(nutrition: Pick<NutritionValues, "kcal" | "proteinG">): number {
  return nutrition.kcal > 0 ? (nutrition.proteinG * 4) / nutrition.kcal : 0;
}

export function deriveTags(recipe: {
  nutritionPerServing: NutritionValues;
  mealTypes: readonly MealType[];
  totalMinutes: number;
  batchFriendly: boolean;
  suitableFor: readonly DietaryPattern[];
}): RecipeTag[] {
  const tags: RecipeTag[] = [];
  const kcal = recipe.nutritionPerServing.kcal;

  if (proteinEnergyShare(recipe.nutritionPerServing) >= HIGH_PROTEIN_MIN_ENERGY_SHARE) tags.push("high_protein");

  const isSnack = recipe.mealTypes.includes("snack");
  const isMeal = recipe.mealTypes.some((type) => type !== "snack");
  if (isSnack && kcal <= SNACK_KCAL_LABEL_MAX) tags.push("under_200_kcal");
  else if (isMeal && kcal <= MEAL_KCAL_LABEL_MAX) tags.push("under_450_kcal");

  if (recipe.totalMinutes <= QUICK_MAX_MINUTES) tags.push("quick");
  if (recipe.batchFriendly) tags.push("batch_friendly");

  if (recipe.suitableFor.includes("vegan")) tags.push("vegan");
  else if (recipe.suitableFor.includes("vegetarian")) tags.push("vegetarian");

  return tags;
}
