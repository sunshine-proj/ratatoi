import type { Ingredient } from "@/lib/ingredients/schema";
import { compareMeals } from "@/lib/planner/operations";
import type { PlannedMeal } from "@/lib/planner/schema";
import type { RecipeUnit } from "@/lib/recipes/schema";
import type { ItemSource, ShoppingCategory, ShoppingItem, ShoppingUnit } from "./schema";
import { shoppingCategories } from "./schema";

/**
 * Shopping-list aggregation. Pure and deterministic: the same plan and range
 * always produce the same lines in the same order.
 *
 * 1. Take every planned meal in the date range.
 * 2. Scale each recipe ingredient by planned servings ÷ recipe servings.
 * 3. Group by canonical ingredient (recipes reference curated keys, so
 *    aliases are already resolved) and unit family:
 *      mass   g
 *      volume ml, tsp, tbsp (a spoon is a fixed volume: 5 ml / 15 ml)
 *      piece  eggs, lemons, slices…
 *    Families are never converted into each other: there is no reliable
 *    ingredient-specific density data, so grams and millilitres of the same
 *    ingredient stay on separate lines.
 * 4. Attach the planned meals each line came from.
 * 5. Sort by aisle, then name.
 *
 * Custom meals have no ingredient list and are counted, not guessed.
 */

export type RecipeIngredientIndex = Record<
  string,
  { servings: number; ingredients: readonly { ingredient: string; quantity: number; unit: RecipeUnit }[] }
>;

type UnitFamily = "mass" | "volume" | "piece";

const ML_PER_TSP = 5;
const ML_PER_TBSP = 15;

export type GeneratedItem = Omit<ShoppingItem, "checked" | "edited">;

export type GenerationResult = {
  items: GeneratedItem[];
  /** Custom meals in range (no ingredient list to add). */
  customMeals: number;
  /** Planned recipes that no longer exist in the catalogue. */
  missingRecipes: number;
  /** Planned recipe meals that contributed ingredients. */
  recipeMeals: number;
};

function familyOf(unit: RecipeUnit): UnitFamily {
  return unit === "g" ? "mass" : unit === "piece" ? "piece" : "volume";
}

/** Quantity in the family's base unit: g, ml, or pieces. */
function toBase(quantity: number, unit: RecipeUnit): number {
  return unit === "tsp" ? quantity * ML_PER_TSP : unit === "tbsp" ? quantity * ML_PER_TBSP : quantity;
}

export function generatedItemId(ingredientKey: string, family: UnitFamily): string {
  return `gen:${ingredientKey}:${family}`;
}

const categoryOrder = (category: ShoppingCategory) => shoppingCategories.indexOf(category);

export function compareItems(a: Pick<ShoppingItem, "category" | "name" | "id">, b: Pick<ShoppingItem, "category" | "name" | "id">): number {
  return (
    categoryOrder(a.category) - categoryOrder(b.category) ||
    a.name.localeCompare(b.name, "en") ||
    a.id.localeCompare(b.id)
  );
}

export function generateItems(
  meals: readonly PlannedMeal[],
  range: { start: string; end: string },
  recipes: RecipeIngredientIndex,
  lookupIngredient: (key: string) => Ingredient | undefined,
): GenerationResult {
  type Accumulator = {
    ingredient: Ingredient;
    family: UnitFamily;
    base: number;
    onlySpoons: boolean;
    sources: ItemSource[];
  };
  const groups = new Map<string, Accumulator>();
  let customMeals = 0;
  let missingRecipes = 0;
  let recipeMeals = 0;

  const inRange = [...meals]
    .filter((meal) => meal.date >= range.start && meal.date <= range.end)
    .sort(compareMeals);

  for (const meal of inRange) {
    if (meal.kind === "custom") {
      customMeals += 1;
      continue;
    }
    const recipe = recipes[meal.recipeSlug];
    if (!recipe) {
      missingRecipes += 1;
      continue;
    }
    recipeMeals += 1;
    const factor = meal.servings / recipe.servings;
    const source: ItemSource = { plannedMealId: meal.id, recipeSlug: meal.recipeSlug, date: meal.date, mealType: meal.mealType };

    for (const line of recipe.ingredients) {
      const ingredient = lookupIngredient(line.ingredient);
      if (!ingredient) continue; // catalogue validation makes this unreachable in practice
      const family = familyOf(line.unit);
      const id = generatedItemId(ingredient.key, family);
      const group = groups.get(id) ?? { ingredient, family, base: 0, onlySpoons: true, sources: [] };
      group.base += toBase(line.quantity, line.unit) * factor;
      if (line.unit === "ml") group.onlySpoons = false;
      if (!group.sources.some((s) => s.plannedMealId === meal.id)) group.sources.push(source);
      groups.set(id, group);
    }
  }

  const items: GeneratedItem[] = [...groups.entries()].map(([id, group]) => {
    let quantity = group.base;
    let unit: ShoppingUnit = group.family === "mass" ? "g" : group.family === "piece" ? "piece" : "ml";
    // Spoon-sized amounts (spices, oil splashes) read better in teaspoons.
    if (group.family === "volume" && group.onlySpoons) {
      quantity = group.base / ML_PER_TSP;
      unit = "tsp";
    }
    return {
      id,
      origin: "generated",
      name: group.ingredient.name,
      canonicalKey: group.ingredient.key,
      category: group.ingredient.category,
      quantity,
      unit,
      planQuantity: quantity,
      planUnit: unit,
      sources: group.sources,
    };
  });

  return { items: items.sort(compareItems), customMeals, missingRecipes, recipeMeals };
}
