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

/** Where an ingredient's nutrition values come from (USDA FoodData Central). */
export const nutritionSourceSchema = z.object({
  dataset: z.enum(["SR Legacy", "Branded"]),
  /** FoodData Central IDs; values are averaged when there are several. */
  fdcIds: z.array(z.number().int().positive()).min(1),
  note: z.string().trim().min(1).optional(),
});
export type NutritionSource = z.infer<typeof nutritionSourceSchema>;

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
  /** Required whenever per100g is set. */
  source: nutritionSourceSchema.optional(),
  /** Needed when recipes use this ingredient by the piece (e.g. eggs). */
  gramsPerPiece: positiveQuantity.optional(),
  /** Needed when recipes use this ingredient by volume; defaults to 1 g/ml. */
  gramsPerMl: positiveQuantity.optional(),
  /** Name for a single piece, e.g. "Lemon" for "Lemons" ("1 Lemon", "½ Onion"). */
  singularName: nonEmptyText.optional(),
  /** Counting word, e.g. "slice"/"slices" for bread, "clove"/"cloves" for garlic. */
  pieceName: z.object({ one: nonEmptyText, other: nonEmptyText }).optional(),
}).refine((ingredient) => ingredient.per100g === null || ingredient.source !== undefined, {
  message: "Ingredients with nutrition values must cite a source",
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type IngredientInput = z.input<typeof ingredientSchema>;
