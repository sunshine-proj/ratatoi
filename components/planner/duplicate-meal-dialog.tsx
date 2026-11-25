"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { addDays } from "@/lib/dates";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatDate, lowercase } from "@/lib/i18n/format";
import { duplicateMeal, findMeal } from "@/lib/planner/operations";
import type { PlannedMeal } from "@/lib/planner/schema";
import { mealTypes, type MealType } from "@/lib/recipes/schema";
import { useRecipeLookup } from "./recipe-lookup";
import { plannedMealName } from "./planned-meal-item";
import { usePlanActions } from "./use-plan-actions";

/** Copy a meal to another day (default: the next day) and meal. */
export function DuplicateMealDialog({ mealId, onClose }: { mealId: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const { plan } = usePlanActions();
  const lookup = useRecipeLookup();
  const meal = plan && mealId ? findMeal(plan, mealId) : undefined;

  return (
    <Dialog
      open={Boolean(meal)}
      onClose={onClose}
      title={meal ? formatMessage(t.planner.duplicateTitle, { name: plannedMealName(meal, lookup.get, t) }) : ""}
    >
      {meal ? <DuplicateForm key={meal.id} meal={meal} onDone={onClose} /> : null}
    </Dialog>
  );
}

function DuplicateForm({ meal, onDone }: { meal: PlannedMeal; onDone: () => void }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { apply } = usePlanActions();
  const [date, setDate] = useState(addDays(meal.date, 1));
  const [mealType, setMealType] = useState<MealType>(meal.mealType);
  // The source day plus the next 13 days.
  const days = Array.from({ length: 14 }, (_, i) => addDays(meal.date, i));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const ok = apply((plan, ctx) => duplicateMeal(plan, meal.id, { date, mealType }, ctx));
        if (!ok) return;
        toast.show({
          message: formatMessage(t.planner.duplicated, {
            meal: lowercase(t.mealTypes[mealType], locale),
            day: formatDate(date, "dayShort", locale),
          }),
          tone: "success",
        });
        onDone();
      }}
    >
      <SelectField id="duplicate-day" label={t.planner.duplicateDay} value={date} onChange={(e) => setDate(e.target.value)}>
        {days.map((day) => (
          <option key={day} value={day}>
            {formatDate(day, "dayShort", locale)}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="duplicate-meal"
        label={t.planner.duplicateMeal}
        value={mealType}
        onChange={(e) => setMealType(e.target.value as MealType)}
      >
        {mealTypes.map((type) => (
          <option key={type} value={type}>
            {t.mealTypes[type]}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.planner.duplicateConfirm}</Button>
      </div>
    </form>
  );
}
