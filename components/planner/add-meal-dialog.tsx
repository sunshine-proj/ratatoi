"use client";

import { useState, type FormEvent } from "react";
import { fieldErrorText, focusFirstError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatDate, lowercase } from "@/lib/i18n/format";
import {
  emptyCustomMealDraft,
  parseCustomMeal,
  type CustomMealDraft,
  type CustomMealErrors,
} from "@/lib/planner/custom-meal-form";
import { addMeal } from "@/lib/planner/operations";
import type { MealType } from "@/lib/recipes/schema";
import { RecipePicker } from "./recipe-picker";
import { ServingsStepper } from "./servings-stepper";
import { usePlanActions } from "./use-plan-actions";

export type AddMealTarget = { date: string; mealType: MealType };

export function AddMealDialog({ target, onClose }: { target: AddMealTarget | null; onClose: () => void }) {
  const { t, locale } = useI18n();
  const current = target;

  return (
    <Dialog
      open={target !== null}
      onClose={onClose}
      variant="sheet"
      className="max-w-2xl"
      title={
        current
          ? formatMessage(t.planner.addDialog.title, {
              meal: lowercase(t.mealTypes[current.mealType], locale),
              day: formatDate(current.date, "dayShort", locale),
            })
          : ""
      }
    >
      {/* Remount per opening so each add starts fresh. */}
      {target ? <AddMealContent key={`${target.date}-${target.mealType}`} target={target} onDone={onClose} /> : null}
    </Dialog>
  );
}

function AddMealContent({ target, onDone }: { target: AddMealTarget; onDone: () => void }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { apply } = usePlanActions();
  const [servings, setServings] = useState(1);
  const day = formatDate(target.date, "dayShort", locale);
  const meal = lowercase(t.mealTypes[target.mealType], locale);

  function added(name: string) {
    toast.show({ message: formatMessage(t.planner.addDialog.added, { name, meal, day }), tone: "success" });
    onDone();
  }

  return (
    <div className="flex flex-col gap-4">
      <ServingsStepper label={t.planner.servingsLabel} value={servings} onChange={setServings} />
      <Tabs
        label={t.planner.addDialog.tabsLabel}
        tabs={[
          {
            id: "recipes",
            label: t.planner.addDialog.recipesTab,
            panel: (
              <RecipePicker
                mealType={target.mealType}
                action={(recipe) => (
                  <Button
                    size="sm"
                    aria-label={formatMessage(t.planner.addDialog.addRecipe, { name: recipe.name })}
                    onClick={() => {
                      const ok = apply((plan, ctx) =>
                        addMeal(plan, { kind: "recipe", recipeSlug: recipe.slug, ...target, servings }, ctx),
                      );
                      if (ok) added(recipe.name);
                    }}
                  >
                    <Icon name="plus" className="size-4" />
                    {t.common.add}
                  </Button>
                )}
              />
            ),
          },
          {
            id: "custom",
            label: t.planner.addDialog.customTab,
            panel: (
              <CustomMealForm
                onSubmit={(content) => {
                  const ok = apply((plan, ctx) => addMeal(plan, { kind: "custom", ...content, ...target, servings }, ctx));
                  if (ok) added(content.name);
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function CustomMealForm({ onSubmit }: {
  onSubmit: (content: { name: string; nutritionPerServing: { kcal: number; proteinG: number; carbsG: number | null; fatG: number | null } }) => void;
}) {
  const { t, locale } = useI18n();
  const c = t.planner.custom;
  const [draft, setDraft] = useState<CustomMealDraft>(emptyCustomMealDraft);
  const [errors, setErrors] = useState<CustomMealErrors>({});
  const set = (field: keyof CustomMealDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseCustomMeal(draft, locale);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError(
        (["name", "kcal", "protein", "carbs", "fat"] as const).map((field) => ({ field, id: `custom-meal-${field}` })),
        result.errors,
      );
      return;
    }
    onSubmit(result.value);
  }

  const numeric = { inputMode: "decimal" as const, autoComplete: "off" };
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-control bg-surface-muted px-3 py-2 text-sm">
        <Icon name="info" className="mt-0.5 size-4 shrink-0" />
        {c.note}
      </p>
      <TextField
        id="custom-meal-name"
        label={c.name}
        hint={c.nameHint}
        autoComplete="off"
        value={draft.name}
        onChange={(event) => set("name", event.target.value)}
        error={fieldErrorText(t, errors.name)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="custom-meal-kcal" label={c.kcal} suffix="kcal" value={draft.kcal} onChange={(e) => set("kcal", e.target.value)} error={fieldErrorText(t, errors.kcal)} {...numeric} />
        <TextField id="custom-meal-protein" label={c.protein} suffix="g" value={draft.protein} onChange={(e) => set("protein", e.target.value)} error={fieldErrorText(t, errors.protein)} {...numeric} />
        <TextField id="custom-meal-carbs" label={c.carbs} hint={c.unknownHint} suffix="g" value={draft.carbs} onChange={(e) => set("carbs", e.target.value)} error={fieldErrorText(t, errors.carbs)} {...numeric} />
        <TextField id="custom-meal-fat" label={c.fat} hint={c.unknownHint} suffix="g" value={draft.fat} onChange={(e) => set("fat", e.target.value)} error={fieldErrorText(t, errors.fat)} {...numeric} />
      </div>
      <Button type="submit" className="self-start">
        {c.submit}
      </Button>
    </form>
  );
}
