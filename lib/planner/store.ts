import { createLocalDocument } from "@/lib/storage/local-document";
import { mealPlanSchema } from "./schema";

/**
 * The guest user's meal plan, stored separately from settings so a damaged
 * plan never takes goals and preferences with it (and vice versa).
 * Bump `version` in the schema and add a migration when the shape changes.
 */
export const PLAN_STORAGE_KEY = "protein-plate:plan";

export const planDocument = createLocalDocument(PLAN_STORAGE_KEY, mealPlanSchema);
