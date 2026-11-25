"use client";

import { ExcludedIngredientsField } from "@/components/preferences/preferences-fields";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { SelectField, TextField } from "@/components/ui/field";
import { fieldErrorText } from "@/components/forms/field-error";
import type { FieldError } from "@/lib/forms/number-field";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { allergens, dietaryPatterns, toggleInList, type Allergen, type DietaryPattern } from "@/lib/preferences/preferences";
import { timeFilterOptions } from "@/lib/recipes/presets";
import { mealTypes, type MealType } from "@/lib/recipes/schema";

export type FilterDraft = {
  mealType: MealType | null;
  proteinMin: string;
  caloriesMax: string;
  totalTimeMax: number | null;
  dietaryPatterns: DietaryPattern[];
  excludeAllergens: Allergen[];
  excludeIngredients: string[];
};

export const emptyFilterDraft: FilterDraft = {
  mealType: null,
  proteinMin: "",
  caloriesMax: "",
  totalTimeMax: null,
  dietaryPatterns: [],
  excludeAllergens: [],
  excludeIngredients: [],
};

export function RecipeFilterFields({ idPrefix, draft, errors, onChange, showMealType }: {
  idPrefix: string;
  draft: FilterDraft;
  errors: { proteinMin?: FieldError; caloriesMax?: FieldError };
  onChange: (draft: FilterDraft) => void;
  showMealType: boolean;
}) {
  const { t } = useI18n();
  const set = <K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) => onChange({ ...draft, [key]: value });

  return (
    <div className="flex flex-col gap-6">
      {showMealType ? (
        <ChoiceGroup
          id={`${idPrefix}-meal`}
          type="radio"
          legend={t.recipes.mealType.legend}
          columns={2}
          value={draft.mealType ?? "any"}
          onChange={(value) => set("mealType", value === "any" ? null : value)}
          options={[
            { value: "any" as const, label: t.recipes.mealType.any },
            ...mealTypes.map((type) => ({ value: type, label: t.mealTypes[type] })),
          ]}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <TextField
          id={`${idPrefix}-protein`}
          label={t.recipes.proteinMin.label}
          hint={t.recipes.proteinMin.hint}
          inputMode="numeric"
          autoComplete="off"
          suffix="g"
          value={draft.proteinMin}
          onChange={(event) => set("proteinMin", event.target.value)}
          error={fieldErrorText(t, errors.proteinMin)}
        />
        <TextField
          id={`${idPrefix}-calories`}
          label={t.recipes.caloriesMax.label}
          hint={t.recipes.caloriesMax.hint}
          inputMode="numeric"
          autoComplete="off"
          suffix="kcal"
          value={draft.caloriesMax}
          onChange={(event) => set("caloriesMax", event.target.value)}
          error={fieldErrorText(t, errors.caloriesMax)}
        />
      </div>

      <SelectField
        id={`${idPrefix}-time`}
        label={t.recipes.timeMax.label}
        value={draft.totalTimeMax ?? ""}
        onChange={(event) => set("totalTimeMax", event.target.value === "" ? null : Number(event.target.value))}
      >
        <option value="">{t.recipes.timeMax.any}</option>
        {timeFilterOptions.map((min) => (
          <option key={min} value={min}>
            {formatMessage(t.recipes.timeMax.option, { min })}
          </option>
        ))}
      </SelectField>

      <ChoiceGroup
        id={`${idPrefix}-diet`}
        type="checkbox"
        legend={t.recipes.diet.legend}
        value={draft.dietaryPatterns}
        onChange={(value, checked) =>
          set("dietaryPatterns", toggleInList(dietaryPatterns, draft.dietaryPatterns, value, checked))
        }
        options={dietaryPatterns.map((pattern) => ({ value: pattern, label: t.preferences.patterns[pattern] }))}
      />

      <details className="group rounded-control border border-line bg-surface" open={draft.excludeAllergens.length > 0 || undefined}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-control px-3 font-medium [&::-webkit-details-marker]:hidden">
          <span>{t.recipes.allergens.legend}</span>
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            {draft.excludeAllergens.length > 0 ? draft.excludeAllergens.length : null}
          </span>
        </summary>
        <div className="px-3 pb-3">
          <ChoiceGroup
            id={`${idPrefix}-allergens`}
            type="checkbox"
            legend={t.recipes.allergens.legend}
            hideLegend
            value={draft.excludeAllergens}
            onChange={(value, checked) =>
              set("excludeAllergens", toggleInList(allergens, draft.excludeAllergens, value, checked))
            }
            options={allergens.map((allergen) => ({ value: allergen, label: t.preferences.allergens[allergen] }))}
          />
        </div>
      </details>

      <ExcludedIngredientsField
        id={`${idPrefix}-exclude`}
        label={t.recipes.excludeIngredient.label}
        hint={t.recipes.excludeIngredient.hint}
        value={draft.excludeIngredients}
        onChange={(value) => set("excludeIngredients", value)}
      />
    </div>
  );
}
