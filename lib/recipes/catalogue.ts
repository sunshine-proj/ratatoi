import { z } from "zod";
import { recipeData } from "@/data/recipes";
import { requireIngredient } from "@/lib/ingredients/catalogue";
import type { IngredientCategory, IngredientKind } from "@/lib/ingredients/schema";
import { allergens as allAllergens, type Allergen, type DietaryPattern } from "@/lib/preferences/preferences";
import { recipeSchema, type Recipe, type RecipeIngredient } from "./schema";
import { deriveTags, type RecipeTag } from "./tags";

/**
 * Read-only recipe catalogue built from the seed data. Validated at module
 * load, so invalid recipe data fails the build rather than reaching users.
 */

export type RecipeSummary = Pick<
  Recipe,
  | "slug"
  | "name"
  | "description"
  | "mealTypes"
  | "servings"
  | "prepMinutes"
  | "cookMinutes"
  | "nutritionPerServing"
  | "nutritionIsEstimated"
  | "image"
  | "batchFriendly"
> & {
  totalMinutes: number;
  /** Derived from ingredients: the EU allergens the recipe contains. */
  allergens: Allergen[];
  /** Derived from ingredients. */
  suitableFor: DietaryPattern[];
  tags: RecipeTag[];
  /** For each ingredient: its name followed by aliases (used by search and exclusions). */
  ingredientNames: string[][];
};

export type RecipeIngredientLine = RecipeIngredient & {
  name: string;
  category: IngredientCategory;
  pieceName?: { one: string; other: string };
};

export type RecipeDetail = RecipeSummary &
  Pick<Recipe, "steps" | "nutritionSource" | "storageNote" | "contentSource"> & {
    ingredients: RecipeIngredientLine[];
  };

export function deriveSuitability(kinds: readonly IngredientKind[]): DietaryPattern[] {
  const set = new Set(kinds);
  const hasMeat = set.has("meat");
  const hasSeafood = set.has("fish") || set.has("shellfish");
  const allPlant = kinds.every((kind) => kind === "plant");
  const suitable: DietaryPattern[] = [];
  if (allPlant) suitable.push("vegan");
  if (!hasMeat && !hasSeafood) suitable.push("vegetarian");
  if (!hasMeat) suitable.push("pescatarian");
  return suitable;
}

function buildDetail(recipe: Recipe): RecipeDetail {
  const lines = recipe.ingredients.map((line) => ({ line, ingredient: requireIngredient(line.ingredient) }));
  const allergenSet = new Set(lines.flatMap(({ ingredient }) => ingredient.allergens));
  const suitableFor = deriveSuitability(lines.map(({ ingredient }) => ingredient.kind));
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  return {
    slug: recipe.slug,
    name: recipe.name,
    description: recipe.description,
    mealTypes: recipe.mealTypes,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    totalMinutes,
    nutritionPerServing: recipe.nutritionPerServing,
    nutritionIsEstimated: recipe.nutritionIsEstimated,
    nutritionSource: recipe.nutritionSource,
    image: recipe.image,
    batchFriendly: recipe.batchFriendly,
    storageNote: recipe.storageNote,
    contentSource: recipe.contentSource,
    steps: recipe.steps,
    allergens: allAllergens.filter((allergen) => allergenSet.has(allergen)),
    suitableFor,
    tags: deriveTags({ ...recipe, totalMinutes, suitableFor }),
    ingredientNames: lines.map(({ ingredient }) => [ingredient.name, ...ingredient.aliases]),
    ingredients: lines.map(({ line, ingredient }) => ({
      ...line,
      name: line.unit === "piece" && line.quantity <= 1 && ingredient.singularName ? ingredient.singularName : ingredient.name,
      category: ingredient.category,
      pieceName: ingredient.pieceName,
    })),
  };
}

const recipes: readonly Recipe[] = z.array(recipeSchema).parse(recipeData);
const details: readonly RecipeDetail[] = recipes.map(buildDetail);
const bySlug = new Map(details.map((detail) => [detail.slug, detail]));
if (bySlug.size !== details.length) throw new Error("Duplicate recipe slugs in data/recipes");

export function getRecipeDetails(): readonly RecipeDetail[] {
  return details;
}

export function getRecipeDetail(slug: string): RecipeDetail | undefined {
  return bySlug.get(slug);
}

/** Card-sized data, small enough to send to the client for filtering. */
export function toSummary(detail: RecipeDetail): RecipeSummary {
  return {
    slug: detail.slug,
    name: detail.name,
    description: detail.description,
    mealTypes: detail.mealTypes,
    servings: detail.servings,
    prepMinutes: detail.prepMinutes,
    cookMinutes: detail.cookMinutes,
    totalMinutes: detail.totalMinutes,
    nutritionPerServing: detail.nutritionPerServing,
    nutritionIsEstimated: detail.nutritionIsEstimated,
    image: detail.image,
    batchFriendly: detail.batchFriendly,
    allergens: detail.allergens,
    suitableFor: detail.suitableFor,
    tags: detail.tags,
    ingredientNames: detail.ingredientNames,
  };
}

export function getRecipeSummaries(): RecipeSummary[] {
  return details.map(toSummary);
}

/** Ingredient lines per recipe, for shopping-list generation in the browser. */
export function getRecipeIngredientIndex(): Record<
  string,
  { servings: number; ingredients: { ingredient: string; quantity: number; unit: RecipeIngredient["unit"] }[] }
> {
  return Object.fromEntries(
    recipes.map((recipe) => [
      recipe.slug,
      {
        servings: recipe.servings,
        ingredients: recipe.ingredients.map(({ ingredient, quantity, unit }) => ({ ingredient, quantity, unit })),
      },
    ]),
  );
}
