import { z } from "zod";

export const dietaryPatterns = ["vegetarian", "vegan", "pescatarian"] as const;
export type DietaryPattern = (typeof dietaryPatterns)[number];

/** The 14 allergens that EU Regulation 1169/2011 requires food labels to declare. */
export const allergens = [
  "celery",
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "tree_nuts",
  "peanuts",
  "sesame",
  "soya",
  "sulphites",
] as const;
export type Allergen = (typeof allergens)[number];

export const cookingSkills = ["beginner", "comfortable", "confident"] as const;
export type CookingSkill = (typeof cookingSkills)[number];

export const budgetPreferences = ["budget", "moderate", "flexible"] as const;
export type BudgetPreference = (typeof budgetPreferences)[number];

export const EXCLUDED_INGREDIENT_MAX_LENGTH = 60;
export const EXCLUDED_INGREDIENTS_MAX = 50;
export const MAIN_MEALS_RANGE = { min: 1, max: 3 } as const;
export const SNACKS_RANGE = { min: 0, max: 4 } as const;

const uniqueArray = <T extends z.ZodType>(item: T) =>
  z.array(item).refine((values) => new Set(values).size === values.length, { message: "Duplicate values" });

export const userPreferencesSchema = z.object({
  dietaryPatterns: uniqueArray(z.enum(dietaryPatterns)),
  allergens: uniqueArray(z.enum(allergens)),
  excludedIngredients: uniqueArray(z.string().trim().min(1).max(EXCLUDED_INGREDIENT_MAX_LENGTH)).max(
    EXCLUDED_INGREDIENTS_MAX,
  ),
  cookingSkill: z.enum(cookingSkills).nullable(),
  budget: z.enum(budgetPreferences).nullable(),
  mainMealsPerDay: z.number().int().min(MAIN_MEALS_RANGE.min).max(MAIN_MEALS_RANGE.max),
  snacksPerDay: z.number().int().min(SNACKS_RANGE.min).max(SNACKS_RANGE.max),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const defaultPreferences: UserPreferences = {
  dietaryPatterns: [],
  allergens: [],
  excludedIngredients: [],
  cookingSkill: null,
  budget: null,
  mainMealsPerDay: 3,
  snacksPerDay: 2,
};

/** Trim, collapse inner whitespace, and lowercase, so "  Red  Onion" matches "red onion". */
export function normalizeIngredientName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export type AddIngredientResult =
  | { status: "added"; list: string[] }
  | { status: "empty" | "duplicate" | "tooLong" | "full"; list: string[] };

export function addExcludedIngredient(list: readonly string[], raw: string): AddIngredientResult {
  const name = normalizeIngredientName(raw);
  const current = [...list];
  if (name === "") return { status: "empty", list: current };
  if (name.length > EXCLUDED_INGREDIENT_MAX_LENGTH) return { status: "tooLong", list: current };
  if (current.includes(name)) return { status: "duplicate", list: current };
  if (current.length >= EXCLUDED_INGREDIENTS_MAX) return { status: "full", list: current };
  return { status: "added", list: [...current, name] };
}

/** Toggle a value in a list, preserving the canonical order of `all`. */
export function toggleInList<T extends string>(all: readonly T[], selected: readonly T[], value: T, on: boolean): T[] {
  const set = new Set(selected);
  if (on) set.add(value);
  else set.delete(value);
  return all.filter((item) => set.has(item));
}
