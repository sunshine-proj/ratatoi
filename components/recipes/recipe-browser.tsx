"use client";

import { Link } from "@/components/ui/link";
import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { parseNumberField } from "@/lib/forms/number-field";
import { formatMessage, type Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber, formatPlural, lowercase } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import type { UserPreferences } from "@/lib/preferences/preferences";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import {
  countActiveFilters,
  emptyFilters,
  filterRecipes,
  hasPreferenceExclusions,
  recipeSorts,
  withPreferences,
  type RecipeFilters,
  type RecipeSort,
} from "@/lib/recipes/filter";
import { snackPresets } from "@/lib/recipes/presets";
import { useSettings } from "@/lib/settings/use-settings";
import { RecipeCard } from "./recipe-card";
import { emptyFilterDraft, RecipeFilterFields, type FilterDraft } from "./recipe-filter-fields";

const LIMITS = { protein: { min: 0, max: 200 }, calories: { min: 0, max: 3000 } };

function parseDraft(draft: FilterDraft, locale: Locale) {
  const protein = parseNumberField(draft.proteinMin, { ...LIMITS.protein, integer: true, locale });
  const calories = parseNumberField(draft.caloriesMax, { ...LIMITS.calories, integer: true, locale });
  return {
    errors: { proteinMin: protein.ok ? undefined : protein.error, caloriesMax: calories.ok ? undefined : calories.error },
    // Invalid numbers are ignored (and flagged) rather than hiding everything.
    proteinMinG: protein.ok ? protein.value : null,
    caloriesMaxKcal: calories.ok ? calories.value : null,
  };
}

export function RecipeBrowser({ recipes, mode }: { recipes: RecipeSummary[]; mode: "all" | "snacks" }) {
  const { t, locale } = useI18n();
  const { state } = useSettings();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<FilterDraft>(emptyFilterDraft);
  const [sort, setSort] = useState<RecipeSort>("protein");
  const [applyPreferences, setApplyPreferences] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const preferences: UserPreferences | null = state.status === "ready" ? state.value.preferences : null;
  const showPreferences = hasPreferenceExclusions(preferences);
  const parsed = parseDraft(draft, locale);

  const filters: RecipeFilters = {
    ...emptyFilters,
    query,
    mealType: mode === "snacks" ? "snack" : draft.mealType,
    proteinMinG: parsed.proteinMinG,
    caloriesMaxKcal: parsed.caloriesMaxKcal,
    totalTimeMaxMinutes: draft.totalTimeMax,
    dietaryPatterns: draft.dietaryPatterns,
    excludeAllergens: draft.excludeAllergens,
    excludeIngredients: draft.excludeIngredients,
  };
  const effective = applyPreferences ? withPreferences(filters, preferences) : filters;
  const results = filterRecipes(recipes, effective, sort, locale);
  const activeCount = countActiveFilters({ ...filters, mealType: mode === "snacks" ? null : filters.mealType });
  const loading = state.status === "loading";

  function clearFilters() {
    setDraft(emptyFilterDraft);
    setQuery("");
  }

  const fieldsProps = {
    draft,
    errors: parsed.errors,
    onChange: setDraft,
    showMealType: mode === "all",
  };

  return (
    <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* Desktop: filters always visible */}
      <aside aria-labelledby="filters-heading-desktop" className="hidden lg:sticky lg:top-6 lg:block">
        <h2 id="filters-heading-desktop" className="mb-4 text-xl font-semibold">
          {t.recipes.filters}
        </h2>
        <RecipeFilterFields idPrefix="filters-desktop" {...fieldsProps} />
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <label htmlFor="recipe-search" className="mb-1.5 block font-medium">
              {t.recipes.searchLabel}
            </label>
            <Icon name="search" className="pointer-events-none absolute bottom-3 left-3 size-5 text-ink-muted" />
            <input
              id="recipe-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.recipes.searchPlaceholder}
              autoComplete="off"
              enterKeyHint="search"
              className="block min-h-11 w-full rounded-control border border-line-strong bg-surface pr-3 pl-10 text-base text-ink placeholder:text-ink-muted"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 lg:hidden" onClick={() => setFiltersOpen(true)}>
              <Icon name="sliders" className="size-5" />
              {activeCount > 0 ? formatMessage(t.recipes.filtersWithCount, { count: activeCount }) : t.recipes.filters}
            </Button>
            <SelectField
              id="recipe-sort"
              label={t.recipes.sort.label}
              className="flex-1 sm:w-48 sm:flex-none [&_label]:sr-only sm:[&_label]:not-sr-only"
              value={sort}
              onChange={(event) => setSort(event.target.value as RecipeSort)}
            >
              {recipeSorts.map((option) => (
                <option key={option} value={option}>
                  {t.recipes.sort[option]}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {mode === "snacks" ? <SnackPresets draft={draft} onChange={setDraft} /> : null}

        {showPreferences && preferences ? (
          <PreferencesNotice preferences={preferences} apply={applyPreferences} onApplyChange={setApplyPreferences} />
        ) : null}

        <ActiveFilters draft={draft} mode={mode} onChange={setDraft} onClear={clearFilters} />

        <section aria-labelledby="results-heading" className="flex flex-col gap-4">
          <h2 id="results-heading" className="sr-only">
            {t.recipes.resultsHeading}
          </h2>
          <p role="status" aria-live="polite" className="text-sm font-medium text-ink-muted">
            {loading ? t.recipes.loading : formatPlural(t.recipes.resultCount, results.length, locale)}
          </p>

          {loading ? (
            <ul aria-hidden="true" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <li key={key} className="overflow-hidden rounded-card border border-line bg-surface motion-safe:animate-pulse">
                  <div className="aspect-[4/3] bg-surface-muted" />
                  <div className="flex flex-col gap-2 p-4">
                    <div className="h-6 w-3/4 rounded-control bg-surface-muted" />
                    <div className="h-4 w-full rounded-control bg-surface-muted" />
                  </div>
                </li>
              ))}
            </ul>
          ) : results.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((recipe, index) => (
                <li key={recipe.slug} className="flex">
                  <RecipeCard recipe={recipe} priority={index < 2} />
                </li>
              ))}
            </ul>
          ) : (
            <Card className="flex flex-col items-start gap-3">
              <h3 className="text-xl font-semibold">{t.recipes.empty.title}</h3>
              <p className="text-ink-muted">
                {t.recipes.empty.body}
                {applyPreferences && showPreferences ? ` ${t.recipes.empty.bodyWithPreferences}` : null}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={clearFilters}>{t.recipes.clearFilters}</Button>
                {applyPreferences && showPreferences ? (
                  <Button variant="secondary" onClick={() => setApplyPreferences(false)}>
                    {t.recipes.preferences.showAll}
                  </Button>
                ) : null}
              </div>
            </Card>
          )}
        </section>
      </div>

      {/* Phones and tablets: filters in a bottom sheet; results update live */}
      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        variant="sheet"
        title={t.recipes.filtersTitle}
        className="lg:hidden"
        footer={
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            {formatPlural(t.recipes.showResults, results.length, locale)}
          </Button>
        }
      >
        <RecipeFilterFields idPrefix="filters-sheet" {...fieldsProps} />
      </Dialog>
    </div>
  );
}

function SnackPresets({ draft, onChange }: { draft: FilterDraft; onChange: (draft: FilterDraft) => void }) {
  const { t, locale } = useI18n();
  const selected =
    draft.proteinMin === "" && draft.caloriesMax === ""
      ? "all"
      : (snackPresets.find(
          (preset) =>
            draft.proteinMin === String(preset.proteinMinG) && draft.caloriesMax === String(preset.caloriesMaxKcal),
        )?.id ?? null);

  return (
    <ChoiceGroup
      id="snack-presets"
      type="radio"
      legend={t.snacks.presetsLegend}
      hint={t.snacks.presetsHint}
      columns={2}
      value={selected}
      onChange={(id) => {
        const preset = snackPresets.find((item) => item.id === id);
        onChange({
          ...draft,
          proteinMin: preset ? String(preset.proteinMinG) : "",
          caloriesMax: preset ? String(preset.caloriesMaxKcal) : "",
        });
      }}
      options={[
        { value: "all", label: t.snacks.allSnacks },
        ...snackPresets.map((preset) => ({
          value: preset.id,
          label: formatMessage(t.snacks.preset, {
            kcal: formatNumber(preset.caloriesMaxKcal, locale),
            g: formatNumber(preset.proteinMinG, locale),
          }),
        })),
      ]}
    />
  );
}

function PreferencesNotice({ preferences, apply, onApplyChange }: {
  preferences: UserPreferences;
  apply: boolean;
  onApplyChange: (apply: boolean) => void;
}) {
  const { t } = useI18n();
  const items = [
    ...preferences.dietaryPatterns.map((pattern) => t.preferences.patterns[pattern]),
    ...preferences.allergens.map((allergen) => t.preferences.allergens[allergen]),
    ...preferences.excludedIngredients,
  ];
  return (
    <section aria-labelledby="prefs-notice-title" className="flex flex-col gap-1 rounded-control border border-line bg-surface px-4 py-3">
      <h2 id="prefs-notice-title" className="font-sans text-sm font-semibold">
        {t.recipes.preferences.title}
      </h2>
      <Checkbox
        label={t.recipes.preferences.apply}
        checked={apply}
        onChange={(event) => onApplyChange(event.target.checked)}
      />
      <p className="text-sm text-ink-muted">
        {apply ? formatMessage(t.recipes.preferences.summary, { list: items.join(", ") }) : t.recipes.preferences.off}{" "}
        <Link href={routes.preferences} className="font-medium text-primary underline underline-offset-2">
          {t.recipes.preferences.edit}
        </Link>
      </p>
    </section>
  );
}

function ActiveFilters({ draft, mode, onChange, onClear }: {
  draft: FilterDraft;
  mode: "all" | "snacks";
  onChange: (draft: FilterDraft) => void;
  onClear: () => void;
}) {
  const { t, locale } = useI18n();
  const parsed = parseDraft(draft, locale);
  const chips: { key: string; label: string; remove: () => FilterDraft }[] = [];

  if (mode === "all" && draft.mealType) {
    chips.push({ key: "meal", label: t.mealTypes[draft.mealType], remove: () => ({ ...draft, mealType: null }) });
  }
  if (parsed.proteinMinG !== null) {
    chips.push({
      key: "protein",
      label: formatMessage(t.recipes.chipProtein, { g: formatNumber(parsed.proteinMinG, locale) }),
      remove: () => ({ ...draft, proteinMin: "" }),
    });
  }
  if (parsed.caloriesMaxKcal !== null) {
    chips.push({
      key: "calories",
      label: formatMessage(t.recipes.chipCalories, { kcal: formatNumber(parsed.caloriesMaxKcal, locale) }),
      remove: () => ({ ...draft, caloriesMax: "" }),
    });
  }
  if (draft.totalTimeMax !== null) {
    chips.push({
      key: "time",
      label: formatMessage(t.recipes.chipTime, { min: draft.totalTimeMax }),
      remove: () => ({ ...draft, totalTimeMax: null }),
    });
  }
  for (const pattern of draft.dietaryPatterns) {
    chips.push({
      key: `diet-${pattern}`,
      label: t.preferences.patterns[pattern],
      remove: () => ({ ...draft, dietaryPatterns: draft.dietaryPatterns.filter((p) => p !== pattern) }),
    });
  }
  for (const allergen of draft.excludeAllergens) {
    chips.push({
      key: `allergen-${allergen}`,
      label: formatMessage(t.recipes.chipWithout, { name: lowercase(t.preferences.allergens[allergen], locale) }),
      remove: () => ({ ...draft, excludeAllergens: draft.excludeAllergens.filter((a) => a !== allergen) }),
    });
  }
  for (const name of draft.excludeIngredients) {
    chips.push({
      key: `ingredient-${name}`,
      label: formatMessage(t.recipes.chipWithout, { name }),
      remove: () => ({ ...draft, excludeIngredients: draft.excludeIngredients.filter((n) => n !== name) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul aria-label={t.recipes.activeFilters} className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              onClick={() => onChange(chip.remove())}
              aria-label={formatMessage(t.recipes.removeFilter, { label: chip.label })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-primary bg-primary-soft px-3 text-sm font-medium text-primary-strong hover:bg-surface"
            >
              {chip.label}
              <Icon name="close" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClear}
        className={buttonClasses({ variant: "ghost", size: "sm" })}
      >
        {t.recipes.clearFilters}
      </button>
    </div>
  );
}
