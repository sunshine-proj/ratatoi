import { z } from "zod";

/**
 * Shared Zod building blocks for boundary validation.
 * Domain-specific schemas (recipes, goals, planned meals, shopping items)
 * live in their own `lib/<domain>/` modules and compose these.
 */

/** Energy or macro amount: finite and non-negative (kcal, g, ml). */
export const nonNegativeAmount = z
  .number()
  .finite()
  .nonnegative({ message: "Must be zero or more." });

/** Quantity that must be above zero, e.g. planned servings or recipe yield. */
export const positiveQuantity = z
  .number()
  .finite()
  .positive({ message: "Must be greater than zero." });

/** Whole number of minutes, e.g. prep or cook time. */
export const minutes = z
  .number()
  .int({ message: "Must be a whole number of minutes." })
  .nonnegative({ message: "Must be zero or more." });

/** Calendar date in ISO 8601 `YYYY-MM-DD` form, with no time or timezone. */
export const isoDate = z.iso.date({ message: "Must be a date in YYYY-MM-DD format." });

/** URL-safe lowercase slug, e.g. `greek-yoghurt-berry-bowl`. */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Use lowercase letters, numbers, and single hyphens.",
  });

/** Non-empty, trimmed text for names and labels. */
export const nonEmptyText = z.string().trim().min(1, { message: "Required." });
