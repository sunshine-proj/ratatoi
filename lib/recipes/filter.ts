import { namesMatchTerm, normalizeText, singularize, tokens } from "@/lib/ingredients/catalogue";
import type { Allergen, DietaryPattern, UserPreferences } from "@/lib/preferences/preferences";
import type { RecipeSummary } from "./catalogue";
import type { MealType } from "./schema";

/**
 * Composable, deterministic recipe filters. Numeric bounds are inclusive
 * and apply to per-serving nutrition. Pure functions: no I/O, no randomness.
 */
export type RecipeFilters = {
  query: string;
  mealType: MealType | null;
  proteinMinG: number | null;
  caloriesMaxKcal: number | null;
  totalTimeMaxMinutes: number | null;
  /** Recipe must suit every selected pattern. */
  dietaryPatterns: DietaryPattern[];
  excludeAllergens: Allergen[];
  /** Free-text ingredient names; matched as whole words against names and aliases. */
  excludeIngredients: string[];
};

export const emptyFilters: RecipeFilters = {
  query: "",
  mealType: null,
  proteinMinG: null,
  caloriesMaxKcal: null,
  totalTimeMaxMinutes: null,
  dietaryPatterns: [],
  excludeAllergens: [],
  excludeIngredients: [],
};

export const recipeSorts = ["protein", "calories", "time", "name"] as const;
export type RecipeSort = (typeof recipeSorts)[number];

/** Every query word must appear (as a prefix or substring) in the name or an ingredient name. */
export function matchesQuery(recipe: RecipeSummary, query: string): boolean {
  const words = normalizeText(query).split(" ").filter(Boolean).map(singularize);
  if (words.length === 0) return true;
  const haystack = [recipe.name, ...recipe.ingredientNames.flat()].map((name) => tokens(name).join(" ")).join(" | ");
  return words.every((word) => haystack.includes(word));
}

export function recipeContainsIngredient(recipe: RecipeSummary, term: string): boolean {
  return recipe.ingredientNames.some((names) => namesMatchTerm(names, term));
}

export function matchesFilters(recipe: RecipeSummary, filters: RecipeFilters): boolean {
  const n = recipe.nutritionPerServing;
  if (filters.mealType && !recipe.mealTypes.includes(filters.mealType)) return false;
  if (filters.proteinMinG !== null && n.proteinG < filters.proteinMinG) return false;
  if (filters.caloriesMaxKcal !== null && n.kcal > filters.caloriesMaxKcal) return false;
  if (filters.totalTimeMaxMinutes !== null && recipe.totalMinutes > filters.totalTimeMaxMinutes) return false;
  if (!filters.dietaryPatterns.every((pattern) => recipe.suitableFor.includes(pattern))) return false;
  if (filters.excludeAllergens.some((allergen) => recipe.allergens.includes(allergen))) return false;
  if (filters.excludeIngredients.some((term) => recipeContainsIngredient(recipe, term))) return false;
  return matchesQuery(recipe, filters.query);
}

const byName = (a: RecipeSummary, b: RecipeSummary) =>
  a.name.localeCompare(b.name, "en") || a.slug.localeCompare(b.slug);

const comparators: Record<RecipeSort, (a: RecipeSummary, b: RecipeSummary) => number> = {
  protein: (a, b) => b.nutritionPerServing.proteinG - a.nutritionPerServing.proteinG || byName(a, b),
  calories: (a, b) => a.nutritionPerServing.kcal - b.nutritionPerServing.kcal || byName(a, b),
  time: (a, b) => a.totalMinutes - b.totalMinutes || byName(a, b),
  name: byName,
};

export function filterRecipes(
  recipes: readonly RecipeSummary[],
  filters: RecipeFilters,
  sort: RecipeSort = "protein",
): RecipeSummary[] {
  return recipes.filter((recipe) => matchesFilters(recipe, filters)).sort(comparators[sort]);
}

const union = <T>(a: readonly T[], b: readonly T[]): T[] => [...new Set([...a, ...b])];

/** Add the user's saved food preferences on top of the visible filters. */
export function withPreferences(filters: RecipeFilters, preferences: UserPreferences | null): RecipeFilters {
  if (!preferences) return filters;
  return {
    ...filters,
    dietaryPatterns: union(filters.dietaryPatterns, preferences.dietaryPatterns),
    excludeAllergens: union(filters.excludeAllergens, preferences.allergens),
    excludeIngredients: union(filters.excludeIngredients, preferences.excludedIngredients),
  };
}

export function hasPreferenceExclusions(preferences: UserPreferences | null): boolean {
  return Boolean(
    preferences &&
      (preferences.dietaryPatterns.length > 0 ||
        preferences.allergens.length > 0 ||
        preferences.excludedIngredients.length > 0),
  );
}

/** Number of user-set filters (query and sort excluded), for the "Filters (n)" button. */
export function countActiveFilters(filters: RecipeFilters): number {
  return (
    (filters.mealType ? 1 : 0) +
    (filters.proteinMinG !== null ? 1 : 0) +
    (filters.caloriesMaxKcal !== null ? 1 : 0) +
    (filters.totalTimeMaxMinutes !== null ? 1 : 0) +
    filters.dietaryPatterns.length +
    filters.excludeAllergens.length +
    filters.excludeIngredients.length
  );
}
