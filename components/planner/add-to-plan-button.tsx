"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { addDays, toLocalIsoDate } from "@/lib/dates";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import { addMeal } from "@/lib/planner/operations";
import { mealTypes, type MealType } from "@/lib/recipes/schema";
import { ServingsStepper } from "./servings-stepper";
import { usePlanActions } from "./use-plan-actions";

type RecipeRef = { slug: string; name: string; mealTypes: readonly MealType[] };

/**
 * "Add to plan" for a recipe: pick a day (today and the next 13 days), a
 * meal, and servings. `variant="icon"` is the compact button used on cards.
 */
export function AddToPlanButton({ recipe, variant = "full" }: { recipe: RecipeRef; variant?: "full" | "icon" }) {
  const t = getMessages();
  const [open, setOpen] = useState(false);
  const label = formatMessage(t.planner.addToPlan.buttonFor, { name: recipe.name });

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={label}
          className="relative z-10 inline-flex size-11 items-center justify-center rounded-pill border border-line-strong bg-surface text-primary shadow-card hover:bg-primary-soft"
        >
          <Icon name="plus" className="size-5" />
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} size="lg" className="self-start">
          <Icon name="plus" className="size-5" />
          {t.planner.addToPlan.button}
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        variant="sheet"
        title={formatMessage(t.planner.addToPlan.title, { name: recipe.name })}
      >
        {open ? <AddToPlanForm recipe={recipe} onDone={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}

function AddToPlanForm({ recipe, onDone }: { recipe: RecipeRef; onDone: () => void }) {
  const t = getMessages();
  const a = t.planner.addToPlan;
  const toast = useToast();
  const router = useRouter();
  const { apply } = usePlanActions();
  const today = toLocalIsoDate();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const [date, setDate] = useState(today);
  const [mealType, setMealType] = useState<MealType>(recipe.mealTypes[0] ?? "lunch");
  const [servings, setServings] = useState(1);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const ok = apply((plan, ctx) =>
          addMeal(plan, { kind: "recipe", recipeSlug: recipe.slug, date, mealType, servings }, ctx),
        );
        if (!ok) return;
        onDone();
        toast.show({
          message: formatMessage(a.added, {
            meal: t.mealTypes[mealType].toLocaleLowerCase("en"),
            day: formatDate(date, "dayShort"),
          }),
          tone: "success",
          action: { label: a.view, onClick: () => router.push(`${routes.planner}?date=${date}`) },
        });
      }}
    >
      <SelectField id="add-to-plan-day" label={a.day} value={date} onChange={(e) => setDate(e.target.value)}>
        {days.map((day) => (
          <option key={day} value={day}>
            {day === today ? `${t.planner.today} · ` : ""}
            {formatDate(day, "dayShort")}
          </option>
        ))}
      </SelectField>
      <ChoiceGroup
        id="add-to-plan-meal"
        type="radio"
        legend={a.meal}
        columns={2}
        value={mealType}
        onChange={setMealType}
        options={mealTypes.map((type) => ({ value: type, label: t.mealTypes[type] }))}
      />
      <ServingsStepper label={t.planner.servingsLabel} value={servings} onChange={setServings} itemName={recipe.name} />
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{a.confirm}</Button>
      </div>
    </form>
  );
}
