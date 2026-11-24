import { z } from "zod";
import { allergens } from "@/lib/preferences/preferences";
import { nonEmptyText, nonNegativeAmount, positiveQuantity, slug } from "@/lib/validation";

/** Shopping-list aisles, in the order a list is shown. */
export const ingredientCategories = [
  "fruit_veg",
  "meat_fish",
  "dairy_eggs",
  "chilled",
  "bakery",
  "frozen",
  "pantry",
  "herbs_spices",
] as const;
export type IngredientCategory = (typeof ingredientCategories)[number];

/** What an ingredient is made from; drives vegan/vegetarian/pescatarian suitability. */
export const ingredientKinds = ["plant", "dairy", "egg", "honey", "fish", "shellfish", "meat"] as const;
export type IngredientKind = (typeof ingredientKinds)[number];

export const nutritionValuesSchema = z.object({
  kcal: nonNegativeAmount,
  proteinG: nonNegativeAmount,
  carbsG: nonNegativeAmount,
  fatG: nonNegativeAmount,
});
export type NutritionValues = z.infer<typeof nutritionValuesSchema>;

export const ingredientSchema = z.object({
  /** Canonical identity used for shopping aggregation and matching. */
  key: slug,
  name: nonEmptyText,
  /** Other names people use. Must be unique across the catalogue. */
  aliases: z.array(nonEmptyText),
  category: z.enum(ingredientCategories),
  kind: z.enum(ingredientKinds),
  allergens: z.array(z.enum(allergens)),
  /**
   * Approximate typical values per 100 g. `null` marks ingredients used in
   * amounts too small to matter (dried spices, fresh herbs).
   */
  per100g: nutritionValuesSchema.nullable(),
  /** Needed when recipes use this ingredient by the piece (e.g. eggs). */
  gramsPerPiece: positiveQuantity.optional(),
  /** Needed when recipes use this ingredient by volume; defaults to 1 g/ml. */
  gramsPerMl: positiveQuantity.optional(),
  /** Name for a single piece, e.g. "Lemon" for "Lemons" ("1 Lemon", "½ Onion"). */
  singularName: nonEmptyText.optional(),
  /** Counting word, e.g. "slice"/"slices" for bread, "clove"/"cloves" for garlic. */
  pieceName: z.object({ one: nonEmptyText, other: nonEmptyText }).optional(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type IngredientInput = z.input<typeof ingredientSchema>;
