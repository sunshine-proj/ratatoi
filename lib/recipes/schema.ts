import { z } from "zod";
import { nutritionValuesSchema } from "@/lib/ingredients/schema";
import { minutes, nonEmptyText, positiveQuantity, slug } from "@/lib/validation";

export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof mealTypes)[number];

/** Units recipes may use. Shopping aggregation never converts between them. */
export const recipeUnits = ["g", "ml", "piece", "tsp", "tbsp"] as const;
export type RecipeUnit = (typeof recipeUnits)[number];

export const recipeIngredientSchema = z.object({
  /** Canonical key from data/ingredients.ts. */
  ingredient: slug,
  quantity: positiveQuantity,
  unit: z.enum(recipeUnits),
  /** Preparation note shown after the name, e.g. "finely chopped". */
  note: z.string().trim().min(1).optional(),
});
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

export const recipeImageSchema = z.object({
  src: nonEmptyText,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Describes the dish as shown; required for informative images. */
  alt: nonEmptyText,
  /** Who made the photo, as it must be credited. */
  attribution: nonEmptyText,
  /** e.g. "Owned by Protein Plate", "CC BY 4.0". Never invent one. */
  licence: nonEmptyText,
  sourceUrl: z.url().optional(),
});
export type RecipeImage = z.infer<typeof recipeImageSchema>;

const uniqueNonEmpty = <T extends z.ZodType>(item: T) =>
  z
    .array(item)
    .min(1)
    .refine((values) => new Set(values).size === values.length, { message: "Duplicate values" });

export const recipeSchema = z.object({
  id: slug,
  slug,
  name: nonEmptyText,
  /** One or two sentences, shown on cards and the detail page. */
  description: nonEmptyText,
  mealTypes: uniqueNonEmpty(z.enum(mealTypes)),
  servings: z.number().int().positive(),
  prepMinutes: minutes,
  cookMinutes: minutes,
  ingredients: z.array(recipeIngredientSchema).min(1),
  steps: z.array(nonEmptyText).min(1),
  /** Stored explicitly; tests check it against the ingredient calculation. */
  nutritionPerServing: nutritionValuesSchema,
  nutritionSource: nonEmptyText,
  nutritionIsEstimated: z.boolean(),
  /** Null means "no licensed photo yet": the UI shows a designed placeholder. */
  image: recipeImageSchema.nullable(),
  /** Author-marked: keeps well for several days, good for cooking ahead. */
  batchFriendly: z.boolean(),
  storageNote: z.string().trim().min(1).optional(),
  contentSource: z.object({ author: nonEmptyText, licence: nonEmptyText }),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = z.input<typeof recipeSchema>;
