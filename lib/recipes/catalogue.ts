import { z } from "zod";
import { ESTIMATED_SOURCE, ORIGINAL_CREDIT, recipeData } from "@/data/recipes";
import { allIngredientNames, ingredientSearchNames, localizedIngredientName, requireIngredient } from "@/lib/ingredients/catalogue";
import { locales, type Locale, type PluralForms } from "@/lib/i18n";
import type { IngredientCategory, IngredientKind } from "@/lib/ingredients/schema";
import { allergens as allAllergens, type Allergen, type DietaryPattern } from "@/lib/preferences/preferences";
import { recipeSchema, type Recipe, type RecipeIngredient } from "./schema";
import { deriveTags, type RecipeTag } from "./tags";
import { getRecipeTranslation } from "./translations";

/**
 * Read-only recipe catalogue built from the seed data. Validated at module
 * load, so invalid recipe data fails the build rather than reaching users.
 * Built once per locale: text comes from lib/recipes/translations.ts
 * (English is the source), numbers and ingredients are shared.
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
  /** For each ingredient: its names and aliases in every language (for exclusions, which work whatever language they were typed in). */
  ingredientNames: string[][];
  /** For each ingredient: its names in this language, then English (for search). */
  searchNames: string[][];
};

export type RecipeIngredientLine = RecipeIngredient & {
  name: string;
  category: IngredientCategory;
  pieceName?: PluralForms;
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

function buildDetail(recipe: Recipe, locale: Locale): RecipeDetail {
  const lines = recipe.ingredients.map((line) => ({ line, ingredient: requireIngredient(line.ingredient) }));
  const translation = getRecipeTranslation(locale);
  const text = translation?.recipes[recipe.slug];
  const isDefaultCredit =
    recipe.contentSource.author === ORIGINAL_CREDIT.author && recipe.contentSource.licence === ORIGINAL_CREDIT.licence;
  const allergenSet = new Set(lines.flatMap(({ ingredient }) => ingredient.allergens));
  const suitableFor = deriveSuitability(lines.map(({ ingredient }) => ingredient.kind));
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  return {
    slug: recipe.slug,
    name: text?.name ?? recipe.name,
    description: text?.description ?? recipe.description,
    mealTypes: recipe.mealTypes,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    totalMinutes,
    nutritionPerServing: recipe.nutritionPerServing,
    nutritionIsEstimated: recipe.nutritionIsEstimated,
    nutritionSource:
      translation && recipe.nutritionSource === ESTIMATED_SOURCE ? translation.nutritionSource : recipe.nutritionSource,
    image: recipe.image,
    batchFriendly: recipe.batchFriendly,
    storageNote: recipe.storageNote === undefined ? undefined : (text?.storageNote ?? recipe.storageNote),
    contentSource: translation && isDefaultCredit ? translation.contentSource : recipe.contentSource,
    steps: text?.steps.length === recipe.steps.length ? [...text.steps] : recipe.steps,
    allergens: allAllergens.filter((allergen) => allergenSet.has(allergen)),
    suitableFor,
    tags: deriveTags({ ...recipe, totalMinutes, suitableFor }),
    ingredientNames: lines.map(({ ingredient }) => {
      const local = localizedIngredientName(ingredient, locale).name;
      return [local, ...allIngredientNames(ingredient).filter((name) => name !== local)];
    }),
    searchNames: lines.map(({ ingredient }) => [
      ...(translation ? ingredientSearchNames(ingredient, locale) : []),
      ingredient.name,
      ...ingredient.aliases,
    ]),
    ingredients: lines.map(({ line, ingredient }) => {
      const local = localizedIngredientName(ingredient, locale);
      const note = line.note === undefined ? undefined : (text?.notes?.[line.ingredient] ?? line.note);
      return {
        ...line,
        note,
        name: line.unit === "piece" && line.quantity <= 1 && local.singularName ? local.singularName : local.name,
        category: ingredient.category,
        pieceName: local.pieceName,
      };
    }),
  };
}

const recipes: readonly Recipe[] = z.array(recipeSchema).parse(recipeData);
if (new Set(recipes.map((recipe) => recipe.slug)).size !== recipes.length) throw new Error("Duplicate recipe slugs in data/recipes");

const detailsByLocale = new Map(locales.map((locale) => [locale, recipes.map((recipe) => buildDetail(recipe, locale))]));
const bySlugByLocale = new Map(
  locales.map((locale) => [locale, new Map(detailsByLocale.get(locale)!.map((detail) => [detail.slug, detail]))]),
);

export function getRecipeDetails(locale: Locale): readonly RecipeDetail[] {
  return detailsByLocale.get(locale)!;
}

export function getRecipeDetail(slug: string, locale: Locale): RecipeDetail | undefined {
  return bySlugByLocale.get(locale)!.get(slug);
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
    searchNames: detail.searchNames,
  };
}

export function getRecipeSummaries(locale: Locale): RecipeSummary[] {
  return getRecipeDetails(locale).map(toSummary);
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
