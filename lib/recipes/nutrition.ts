import type { Ingredient, NutritionValues } from "@/lib/ingredients/schema";
import type { RecipeIngredient } from "./schema";

const ML_PER_TSP = 5;
const ML_PER_TBSP = 15;

/** Weight in grams of a recipe ingredient line, used for nutrition only. */
export function ingredientGrams(line: RecipeIngredient, ingredient: Ingredient): number {
  const gramsPerMl = ingredient.gramsPerMl ?? 1;
  switch (line.unit) {
    case "g":
      return line.quantity;
    case "ml":
      return line.quantity * gramsPerMl;
    case "tsp":
      return line.quantity * ML_PER_TSP * gramsPerMl;
    case "tbsp":
      return line.quantity * ML_PER_TBSP * gramsPerMl;
    case "piece":
      if (!ingredient.gramsPerPiece) {
        throw new Error(`Ingredient "${ingredient.key}" is used by the piece but has no gramsPerPiece`);
      }
      return line.quantity * ingredient.gramsPerPiece;
  }
}

/**
 * Per-serving nutrition from ingredient values. Ingredients marked as
 * negligible (per100g: null) contribute nothing. Full precision is kept;
 * round only for display or storage.
 */
export function calculateNutritionPerServing(
  lines: readonly RecipeIngredient[],
  servings: number,
  lookup: (key: string) => Ingredient,
): NutritionValues {
  const total: NutritionValues = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  for (const line of lines) {
    const ingredient = lookup(line.ingredient);
    if (!ingredient.per100g) continue;
    const factor = ingredientGrams(line, ingredient) / 100;
    total.kcal += ingredient.per100g.kcal * factor;
    total.proteinG += ingredient.per100g.proteinG * factor;
    total.carbsG += ingredient.per100g.carbsG * factor;
    total.fatG += ingredient.per100g.fatG * factor;
  }
  return {
    kcal: total.kcal / servings,
    proteinG: total.proteinG / servings,
    carbsG: total.carbsG / servings,
    fatG: total.fatG / servings,
  };
}

/** Storage rounding: whole kcal, macros to 1 decimal place. */
export function roundNutrition(values: NutritionValues): NutritionValues {
  const one = (n: number) => Math.round(n * 10) / 10;
  return { kcal: Math.round(values.kcal), proteinG: one(values.proteinG), carbsG: one(values.carbsG), fatG: one(values.fatG) };
}
