"use client";

import { useId, useState, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { RecipeImage } from "@/components/recipes/recipe-image";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber } from "@/lib/i18n/format";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import { emptyFilters, filterRecipes, hasPreferenceExclusions, withPreferences } from "@/lib/recipes/filter";
import type { MealType } from "@/lib/recipes/schema";
import { useSettings } from "@/lib/settings/use-settings";
import { useRecipeLookup } from "./recipe-lookup";

/**
 * Searchable list of recipes for one meal type, with the user's food
 * preferences applied by default. Each row gets an action (Add / Swap in).
 */
export function RecipePicker({ mealType, excludeSlug, action, detail }: {
  mealType: MealType;
  excludeSlug?: string;
  action: (recipe: RecipeSummary) => ReactNode;
  /** Optional extra line per recipe, e.g. the day total after a swap. */
  detail?: (recipe: RecipeSummary) => ReactNode;
}) {
  const { t, locale } = useI18n();
  const { all } = useRecipeLookup();
  const { state } = useSettings();
  const preferences = state.status === "ready" ? state.value.preferences : null;
  const [query, setQuery] = useState("");
  const [applyPreferences, setApplyPreferences] = useState(true);
  const searchId = useId();

  const showPreferences = hasPreferenceExclusions(preferences);
  const filters = { ...emptyFilters, query, mealType };
  const results = filterRecipes(all, applyPreferences ? withPreferences(filters, preferences) : filters, "name", locale).filter(
    (recipe) => recipe.slug !== excludeSlug,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor={searchId} className="mb-1.5 block font-medium">
          {t.planner.addDialog.search}
        </label>
        <Icon name="search" className="pointer-events-none absolute bottom-3 left-3 size-5 text-ink-muted" />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          className="block min-h-11 w-full rounded-control border border-line-strong bg-surface pr-3 pl-10 text-base"
        />
      </div>
      {showPreferences ? (
        <div className="text-sm">
          <Checkbox
            label={t.planner.addDialog.includeAll}
            checked={!applyPreferences}
            onChange={(event) => setApplyPreferences(!event.target.checked)}
          />
          {applyPreferences ? <p className="text-ink-muted">{t.planner.addDialog.usingPreferences}</p> : null}
        </div>
      ) : null}

      {results.length === 0 ? (
        <p className="rounded-control bg-surface-muted px-4 py-3">{t.planner.addDialog.noResults}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
          {results.map((recipe) => (
            <li key={recipe.slug} className="flex flex-wrap items-center gap-3 p-3">
              <RecipeImage
                image={recipe.image}
                mealType={recipe.mealTypes[0]!}
                sizes="64px"
                className="w-16 shrink-0 rounded-control"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{recipe.name}</span>
                <span className="text-sm text-ink-muted">
                  {formatMessage(t.planner.mealNutrition, {
                    kcal: formatNumber(recipe.nutritionPerServing.kcal, locale),
                    protein: formatNumber(recipe.nutritionPerServing.proteinG, locale),
                  })}
                  {" · "}
                  {formatMessage(t.recipes.card.minutes, { min: recipe.totalMinutes })}
                </span>
                {detail ? <span className="text-sm">{detail(recipe)}</span> : null}
              </div>
              <div className="ml-auto">{action(recipe)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
