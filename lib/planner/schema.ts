import { z } from "zod";
import { mealTypes } from "@/lib/recipes/schema";
import { isoDate, nonEmptyText, nonNegativeAmount, slug } from "@/lib/validation";

export const SERVINGS_MIN = 0.25;
export const SERVINGS_MAX = 20;
export const SERVINGS_STEP = 0.25;
export const CUSTOM_NAME_MAX = 80;

/** Portions eaten: quarter steps from ¼ to 20. */
export const servingsSchema = z
  .number()
  .min(SERVINGS_MIN)
  .max(SERVINGS_MAX)
  .refine((value) => Number.isInteger(value / SERVINGS_STEP), { message: "Use quarter servings" });

const base = {
  id: z.string().min(1).max(64),
  /** Local calendar date, `YYYY-MM-DD`. See lib/dates.ts. */
  date: isoDate,
  mealType: z.enum(mealTypes),
  /** Order within the (date, meal type) slot, 0-based and contiguous. */
  position: z.number().int().nonnegative(),
  servings: servingsSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
};

export const plannedRecipeSchema = z.object({
  ...base,
  kind: z.literal("recipe"),
  recipeSlug: slug,
});

/**
 * Something the user ate or will eat that isn't in the catalogue. Nutrition
 * is whatever they entered: calories and protein are required, carbohydrate
 * and fat may be unknown (null). Never presented as a verified recipe.
 */
export const customMealNutritionSchema = z.object({
  kcal: nonNegativeAmount.max(5000),
  proteinG: nonNegativeAmount.max(500),
  carbsG: nonNegativeAmount.max(1000).nullable(),
  fatG: nonNegativeAmount.max(500).nullable(),
});
export type CustomMealNutrition = z.infer<typeof customMealNutritionSchema>;

export const plannedCustomMealSchema = z.object({
  ...base,
  kind: z.literal("custom"),
  name: nonEmptyText.max(CUSTOM_NAME_MAX),
  nutritionPerServing: customMealNutritionSchema,
});

export const plannedMealSchema = z.discriminatedUnion("kind", [plannedRecipeSchema, plannedCustomMealSchema]);
export type PlannedMeal = z.infer<typeof plannedMealSchema>;
export type PlannedRecipe = z.infer<typeof plannedRecipeSchema>;
export type PlannedCustomMeal = z.infer<typeof plannedCustomMealSchema>;

export const mealPlanSchema = z
  .object({
    version: z.literal(1),
    meals: z.array(plannedMealSchema),
  })
  .refine((plan) => new Set(plan.meals.map((meal) => meal.id)).size === plan.meals.length, {
    message: "Duplicate meal ids",
  });

export type MealPlan = z.infer<typeof mealPlanSchema>;

export const emptyPlan: MealPlan = { version: 1, meals: [] };
