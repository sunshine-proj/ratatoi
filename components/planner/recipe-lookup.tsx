"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { NutritionValues } from "@/lib/ingredients/schema";
import type { RecipeSummary } from "@/lib/recipes/catalogue";

type RecipeLookup = {
  all: readonly RecipeSummary[];
  get: (slug: string) => RecipeSummary | undefined;
  nutrition: (slug: string) => NutritionValues | undefined;
};

const RecipeLookupContext = createContext<RecipeLookup | null>(null);

/** Makes the recipe catalogue (card-sized data) available to planner components. */
export function RecipeLookupProvider({ recipes, children }: { recipes: readonly RecipeSummary[]; children: ReactNode }) {
  const value = useMemo(() => {
    const bySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]));
    return {
      all: recipes,
      get: (slug: string) => bySlug.get(slug),
      nutrition: (slug: string) => bySlug.get(slug)?.nutritionPerServing,
    };
  }, [recipes]);
  return <RecipeLookupContext.Provider value={value}>{children}</RecipeLookupContext.Provider>;
}

export function useRecipeLookup(): RecipeLookup {
  const value = useContext(RecipeLookupContext);
  if (!value) throw new Error("useRecipeLookup must be used inside <RecipeLookupProvider>");
  return value;
}
