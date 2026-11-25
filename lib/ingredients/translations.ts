import type { Locale, PluralForms } from "@/lib/i18n";
import { et } from "@/data/translations/et/ingredients";
import { lt } from "@/data/translations/lt/ingredients";
import { lv } from "@/data/translations/lv/ingredients";

/**
 * Ingredient names in Latvian, Lithuanian, and Estonian. English is the
 * source (data/ingredients.ts). Small enough to ship to the browser, where
 * the shopping list needs it. Recipe text lives separately
 * (lib/recipes/translations.ts) and stays on the server.
 *
 * tests/unit/i18n/content-translations.test.ts checks every locale names
 * every ingredient.
 */
export type IngredientText = {
  name: string;
  /** Other names people use (other spellings, singular/plural forms), for search, exclusions, and your own list items. */
  aliases?: readonly string[];
  /** Counting word for pieces, e.g. garlic cloves. Defaults to `pieces`. */
  pieceName?: PluralForms;
};

export type IngredientTranslation = {
  /** Generic counting word for pieces ("gab.", "vnt.", "tk"). */
  pieces: PluralForms;
  ingredients: Readonly<Record<string, IngredientText>>;
};

export const ingredientTranslations: Record<Exclude<Locale, "en">, IngredientTranslation> = { lv, lt, et };

export function getIngredientTranslation(locale: Locale): IngredientTranslation | null {
  return locale === "en" ? null : ingredientTranslations[locale];
}
