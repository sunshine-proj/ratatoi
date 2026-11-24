import { recipeData } from "@/data/recipes";

/**
 * Known recipe slugs, without schema parsing, so Proxy can check them
 * cheaply. (Validation happens in lib/recipes/catalogue.ts and its tests.)
 */
export const recipeSlugs: ReadonlySet<string> = new Set(recipeData.map((recipe) => recipe.slug));
