"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { FieldMessages, SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { formatMessage, getMessages } from "@/lib/i18n";
import {
  addExcludedIngredient,
  allergens,
  budgetPreferences,
  cookingSkills,
  dietaryPatterns,
  EXCLUDED_INGREDIENT_MAX_LENGTH,
  EXCLUDED_INGREDIENTS_MAX,
  MAIN_MEALS_RANGE,
  normalizeIngredientName,
  SNACKS_RANGE,
  toggleInList,
  type UserPreferences,
} from "@/lib/preferences/preferences";

const range = ({ min, max }: { min: number; max: number }) =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i);

export function PreferencesFields({ idPrefix, value, onChange }: {
  idPrefix: string;
  value: UserPreferences;
  onChange: (value: UserPreferences) => void;
}) {
  const t = getMessages();
  const set = <K extends keyof UserPreferences>(key: K, next: UserPreferences[K]) => onChange({ ...value, [key]: next });

  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup
        id={`${idPrefix}-patterns`}
        type="checkbox"
        legend={t.preferences.patterns.legend}
        hint={t.preferences.patterns.hint}
        columns={3}
        value={value.dietaryPatterns}
        onChange={(item, checked) => set("dietaryPatterns", toggleInList(dietaryPatterns, value.dietaryPatterns, item, checked))}
        options={dietaryPatterns.map((item) => ({ value: item, label: t.preferences.patterns[item] }))}
      />

      <ChoiceGroup
        id={`${idPrefix}-allergens`}
        type="checkbox"
        legend={t.preferences.allergens.legend}
        hint={t.preferences.allergens.hint}
        columns={2}
        value={value.allergens}
        onChange={(item, checked) => set("allergens", toggleInList(allergens, value.allergens, item, checked))}
        options={allergens.map((item) => ({ value: item, label: t.preferences.allergens[item] }))}
      />

      <ExcludedIngredientsField
        id={`${idPrefix}-excluded`}
        value={value.excludedIngredients}
        onChange={(next) => set("excludedIngredients", next)}
      />

      <ChoiceGroup
        id={`${idPrefix}-skill`}
        type="radio"
        legend={t.preferences.skill.legend}
        columns={3}
        value={value.cookingSkill}
        onChange={(item) => set("cookingSkill", item)}
        options={cookingSkills.map((item) => ({
          value: item,
          label: t.preferences.skill[item].label,
          description: t.preferences.skill[item].description,
        }))}
      />

      <ChoiceGroup
        id={`${idPrefix}-budget`}
        type="radio"
        legend={t.preferences.budget.legend}
        columns={3}
        value={value.budget}
        onChange={(item) => set("budget", item)}
        options={budgetPreferences.map((item) => ({
          value: item,
          label: t.preferences.budget[item].label,
          description: t.preferences.budget[item].description,
        }))}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">
          {t.preferences.meals.main} / {t.preferences.meals.snacks}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id={`${idPrefix}-main-meals`}
            label={t.preferences.meals.main}
            value={value.mainMealsPerDay}
            onChange={(event) => set("mainMealsPerDay", Number(event.target.value))}
          >
            {range(MAIN_MEALS_RANGE).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
          <SelectField
            id={`${idPrefix}-snacks`}
            label={t.preferences.meals.snacks}
            value={value.snacksPerDay}
            onChange={(event) => set("snacksPerDay", Number(event.target.value))}
          >
            {range(SNACKS_RANGE).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
        </div>
        <p className="text-sm text-ink-muted">{t.preferences.meals.hint}</p>
      </fieldset>
    </div>
  );
}

/** Free-text list with add/remove, announcing changes politely. */
function ExcludedIngredientsField({ id, value, onChange }: {
  id: string;
  value: readonly string[];
  onChange: (value: string[]) => void;
}) {
  const t = getMessages();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState("");
  const listId = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  function add() {
    const result = addExcludedIngredient(value, text);
    const name = normalizeIngredientName(text);
    switch (result.status) {
      case "added":
        onChange(result.list);
        setText("");
        setError(undefined);
        setAnnouncement(formatMessage(t.preferences.excluded.added, { name }));
        return;
      case "empty":
        setError(t.preferences.excluded.empty);
        return;
      case "duplicate":
        setError(formatMessage(t.preferences.excluded.duplicate, { name }));
        return;
      case "tooLong":
        setError(formatMessage(t.preferences.excluded.tooLong, { max: EXCLUDED_INGREDIENT_MAX_LENGTH }));
        return;
      case "full":
        setError(formatMessage(t.preferences.excluded.full, { max: EXCLUDED_INGREDIENTS_MAX }));
        return;
    }
  }

  function remove(name: string) {
    onChange(value.filter((item) => item !== name));
    setAnnouncement(formatMessage(t.preferences.excluded.removed, { name }));
    // Keep focus in a sensible place after the button disappears.
    document.getElementById(id)?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {t.preferences.excluded.label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={text}
          autoComplete="off"
          enterKeyHint="done"
          maxLength={EXCLUDED_INGREDIENT_MAX_LENGTH + 10}
          aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(undefined);
          }}
          onKeyDown={(event) => {
            // Enter adds the ingredient instead of submitting the whole form.
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className={`block min-h-11 w-full flex-1 rounded-control border bg-surface px-3 text-base text-ink ${error ? "border-danger" : "border-line-strong"}`}
        />
        <Button variant="secondary" onClick={add}>
          {t.preferences.excluded.add}
        </Button>
      </div>
      <FieldMessages hint={t.preferences.excluded.hint} error={error} hintId={hintId} errorId={errorId} />

      {value.length > 0 ? (
        <ul id={listId} aria-label={t.preferences.excluded.listLabel} className="mt-2 flex flex-wrap gap-2">
          {value.map((name) => (
            <li key={name} className="inline-flex items-center rounded-pill bg-surface-muted pl-3 text-sm font-medium">
              <span>{name}</span>
              <button
                type="button"
                onClick={() => remove(name)}
                className="inline-flex size-11 items-center justify-center rounded-pill text-ink-muted hover:text-ink"
              >
                <Icon name="close" className="size-4" label={formatMessage(t.preferences.excluded.remove, { name })} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
