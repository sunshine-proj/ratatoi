import { createLocalDocument } from "@/lib/storage/local-document";
import { shoppingListSchema } from "./schema";

/**
 * The guest user's shopping list, stored separately from the plan and
 * settings so a damaged list never affects them.
 */
export const SHOPPING_STORAGE_KEY = "protein-plate:shopping";

export const shoppingDocument = createLocalDocument(SHOPPING_STORAGE_KEY, shoppingListSchema);
