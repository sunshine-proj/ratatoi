import { z } from "zod";
import { ingredientCategories } from "@/lib/ingredients/schema";
import { mealTypes } from "@/lib/recipes/schema";
import { isoDate, nonEmptyText, slug } from "@/lib/validation";

/** Aisles, plus "other" for manual items that don't match the catalogue. */
export const shoppingCategories = [...ingredientCategories, "other"] as const;
export type ShoppingCategory = (typeof shoppingCategories)[number];

/** Units a list line can use. Generated lines use g, ml, tsp, or piece. */
export const shoppingUnits = ["g", "kg", "ml", "l", "tsp", "tbsp", "piece", "pack"] as const;
export type ShoppingUnit = (typeof shoppingUnits)[number];

export const SHOPPING_NAME_MAX = 80;

export const itemSourceSchema = z.object({
  plannedMealId: z.string().min(1),
  recipeSlug: slug,
  date: isoDate,
  mealType: z.enum(mealTypes),
});
export type ItemSource = z.infer<typeof itemSourceSchema>;

export const shoppingItemSchema = z.object({
  /**
   * Stable identity. Generated lines: `gen:<ingredient key>:<unit family>`,
   * so the same ingredient keeps its id (and tick) across regenerations.
   * Manual lines: `manual:<uuid>`.
   */
  id: z.string().min(1).max(120),
  origin: z.enum(["generated", "manual"]),
  name: nonEmptyText.max(SHOPPING_NAME_MAX),
  /** Canonical ingredient key when known (always for generated lines). */
  canonicalKey: slug.nullable(),
  category: z.enum(shoppingCategories),
  /** Null when a manual item has no amount ("washing-up liquid"). */
  quantity: z.number().finite().nonnegative().nullable(),
  unit: z.enum(shoppingUnits).nullable(),
  checked: z.boolean(),
  /** The user changed the amount or unit of a generated line. */
  edited: z.boolean(),
  /** For generated lines: what the plan needs, as of the last update. */
  planQuantity: z.number().finite().nonnegative().nullable(),
  planUnit: z.enum(shoppingUnits).nullable(),
  /** Which planned meals need this (generated lines only). */
  sources: z.array(itemSourceSchema),
});
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;

export const shoppingListSchema = z
  .object({
    version: z.literal(1),
    /** Dates the generated lines were calculated for (inclusive). */
    range: z.object({ start: isoDate, end: isoDate }).nullable(),
    generatedAt: z.iso.datetime().nullable(),
    items: z.array(shoppingItemSchema),
  })
  .refine((list) => new Set(list.items.map((item) => item.id)).size === list.items.length, {
    message: "Duplicate item ids",
  })
  .refine((list) => !list.range || list.range.start <= list.range.end, { message: "Range ends before it starts" });

export type ShoppingList = z.infer<typeof shoppingListSchema>;

export const emptyShoppingList: ShoppingList = { version: 1, range: null, generatedAt: null, items: [] };
