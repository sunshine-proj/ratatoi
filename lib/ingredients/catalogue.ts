import { z } from "zod";
import { ingredientData } from "@/data/ingredients";
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

/** Every name and alias (normalised, singular) → canonical key. */
const aliasIndex = new Map<string, string>();
for (const ingredient of ingredients) {
  for (const name of [ingredient.name, ...ingredient.aliases]) {
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
