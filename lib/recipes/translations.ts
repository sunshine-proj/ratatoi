import type { Locale } from "@/lib/i18n";
import { et } from "@/data/translations/et/recipes";
import { lt } from "@/data/translations/lt/recipes";
import { lv } from "@/data/translations/lv/recipes";

/**
 * Recipe text in Latvian, Lithuanian, and Estonian. English is the source
 * (data/recipes/). Used on the server only: pages send the browser just
 * the current language's recipes.
 *
 * tests/unit/i18n/content-translations.test.ts checks every locale covers
 * every recipe, step, and note.
 */
export type RecipeText = {
  name: string;
  description: string;
  steps: readonly string[];
  /** Ingredient preparation notes, by ingredient key ("finely chopped"). */
  notes?: Readonly<Record<string, string>>;
  storageNote?: string;
};

export type RecipeTranslation = {
  /** The shared nutrition-source sentence shown on every recipe. */
  nutritionSource: string;
  /** The shared credit for original recipes. */
  contentSource: { author: string; licence: string };
  recipes: Readonly<Record<string, RecipeText>>;
};

export const recipeTranslations: Record<Exclude<Locale, "en">, RecipeTranslation> = { lv, lt, et };

export function getRecipeTranslation(locale: Locale): RecipeTranslation | null {
  return locale === "en" ? null : recipeTranslations[locale];
}
