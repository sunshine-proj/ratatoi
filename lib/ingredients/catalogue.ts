import { z } from "zod";
import { ingredientData } from "@/data/ingredients";
import { getIngredientTranslation, ingredientTranslations } from "./translations";
import type { Locale, PluralForms } from "@/lib/i18n";
import { ingredientSchema, type Ingredient } from "./schema";

/**
 * Text normalisation for matching: lowercase, strip accents and punctuation,
 * collapse whitespace. "Crème fraîche!" → "creme fraiche".
 */
export function normalizeText(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Light English singularisation so "tomato" matches "tomatoes" and "berry"
 * matches "berries". Deliberately conservative; it only has to make the
 * curated catalogue match what people type.
 */
export function singularize(word: string): string {
  if (word.length <= 3 || /(ss|us|is)$/.test(word)) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ves")) return `${word.slice(0, -3)}f`;
  if (/(oes|ches|shes|xes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function tokens(raw: string): string[] {
  const text = normalizeText(raw);
  return text === "" ? [] : text.split(" ").map(singularize);
}

function containsSequence(haystack: readonly string[], needle: readonly string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle.every((word, j) => haystack[i + j] === word)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Catalogue (validated once at module load; invalid data fails the build)
// ---------------------------------------------------------------------------

export const ingredients: readonly Ingredient[] = z.array(ingredientSchema).parse(ingredientData);

const byKey = new Map(ingredients.map((ingredient) => [ingredient.key, ingredient]));
if (byKey.size !== ingredients.length) throw new Error("Duplicate ingredient keys in data/ingredients.ts");

/**
 * Every name and alias an ingredient has, in every language: English first,
 * then Latvian, Lithuanian, Estonian. Matching uses all of them, so saved
 * exclusions and your own list items keep working after switching language.
 */
export function allIngredientNames(ingredient: Ingredient): string[] {
  const names = [ingredient.name, ...ingredient.aliases];
  for (const translation of Object.values(ingredientTranslations)) {
    const text = translation.ingredients[ingredient.key];
    if (text) names.push(text.name, ...(text.aliases ?? []));
  }
  return [...new Set(names)];
}

/** An ingredient's name and aliases in one language (empty for English, whose names are on the ingredient). */
export function ingredientSearchNames(ingredient: Ingredient, locale: Locale): string[] {
  const text = getIngredientTranslation(locale)?.ingredients[ingredient.key];
  return text ? [text.name, ...(text.aliases ?? [])] : [];
}

/** Every name and alias (normalised, singular) → canonical key. */
const aliasIndex = new Map<string, string>();
for (const ingredient of ingredients) {
  for (const name of allIngredientNames(ingredient)) {
    const normalized = tokens(name).join(" ");
    const existing = aliasIndex.get(normalized);
    if (existing && existing !== ingredient.key) {
      throw new Error(`Ingredient alias "${name}" is used by both "${existing}" and "${ingredient.key}"`);
    }
    aliasIndex.set(normalized, ingredient.key);
  }
}

export function getIngredient(key: string): Ingredient | undefined {
  return byKey.get(key);
}

export function requireIngredient(key: string): Ingredient {
  const ingredient = byKey.get(key);
  if (!ingredient) throw new Error(`Unknown ingredient "${key}"`);
  return ingredient;
}

/** How an ingredient is named in one language. */
export type LocalizedIngredientName = {
  name: string;
  /** English only: the name for a single piece ("Lemon"). */
  singularName?: string;
  /** Counting word for pieces ("slice/slices", "skiltelė/skiltelės"). */
  pieceName?: PluralForms;
};

/**
 * An ingredient's display name in a locale. Outside English, pieces are
 * always counted with a word ("2 vnt."), because Baltic nouns change form
 * with the number and a bare "2 Citrinos" would often be ungrammatical.
 * Falls back to English if a translation is missing.
 */
export function localizedIngredientName(ingredient: Ingredient, locale: Locale): LocalizedIngredientName {
  const translation = getIngredientTranslation(locale);
  const text = translation?.ingredients[ingredient.key];
  if (!translation || !text) {
    return { name: ingredient.name, singularName: ingredient.singularName, pieceName: ingredient.pieceName };
  }
  return { name: text.name, pieceName: text.pieceName ?? translation.pieces };
}

/** `localizedIngredientName` by key; undefined for unknown keys. */
export function getLocalizedIngredientName(key: string, locale: Locale): LocalizedIngredientName | undefined {
  const ingredient = byKey.get(key);
  return ingredient ? localizedIngredientName(ingredient, locale) : undefined;
}

/** Resolve a free-text name ("Greek yogurt", "tomatoes") to a canonical key, if curated. */
export function resolveIngredientKey(name: string): string | undefined {
  return aliasIndex.get(tokens(name).join(" "));
}

/**
 * Whether a term ("tomato", "red onion") names one of these ingredient names
 * (an ingredient's name and aliases). Matches whole words, singular or
 * plural: "tomato" matches "Cherry tomatoes", while "nut" does not match
 * "Peanut butter" (nut allergies are handled by allergen filters). Used for
 * exclusions, so when in doubt it errs towards matching.
 */
export function namesMatchTerm(names: readonly string[], term: string): boolean {
  const needle = tokens(term);
  if (needle.length === 0) return false;
  return names.some((name) => containsSequence(tokens(name), needle));
}
