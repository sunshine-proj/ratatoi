"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatDate, formatNumber, formatPlural } from "@/lib/i18n/format";
import { sumNutrition } from "@/lib/nutrition/totals";
import { mealsInSlot, mealsOn } from "@/lib/planner/operations";
import type { MealPlan } from "@/lib/planner/schema";
import { mealTypes, type MealType } from "@/lib/recipes/schema";
import { DAY_PANEL_ID, dayTabId } from "./day-tabs";
import { PlannedMealItem } from "./planned-meal-item";
import { useRecipeLookup } from "./recipe-lookup";

export function DayPlan({ plan, date, today, onAdd, onSwap, onDuplicate, onClearDay }: {
  plan: MealPlan;
  date: string;
  today: string;
  onAdd: (mealType: MealType) => void;
  onSwap: (mealId: string) => void;
  onDuplicate: (mealId: string) => void;
  onClearDay: () => void;
}) {
  const t = getMessages();
  const lookup = useRecipeLookup();
  const meals = mealsOn(plan, date);
  const totals = sumNutrition(meals, lookup.nutrition);

  return (
    <section id={DAY_PANEL_ID} role="tabpanel" aria-labelledby={dayTabId(date)} className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold">
            {formatDate(date, "dayLong")}
            {date === today ? <span className="ml-2 align-middle text-sm font-medium text-primary">· {t.planner.today}</span> : null}
          </h2>
          {meals.length > 0 ? (
            <>
              <p aria-live="polite" className="font-medium">
                {formatMessage(t.planner.dayTotals, {
                  kcal: formatNumber(totals.kcal),
                  protein: formatNumber(totals.proteinG),
                })}
              </p>
              {totals.unknownMeals > 0 ? (
                <p className="text-sm text-ink-muted">{formatPlural(t.planner.unknownMeals, totals.unknownMeals)}</p>
              ) : null}
            </>
          ) : (
            <p className="text-ink-muted">{t.planner.emptyDay}</p>
          )}
        </div>
        {meals.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={onClearDay}>
            {t.planner.clearDay}
          </Button>
        ) : null}
      </header>

      {mealTypes.map((mealType) => {
        const slot = mealsInSlot(plan, date, mealType);
        const headingId = `slot-${date}-${mealType}`;
        return (
          <section key={mealType} aria-labelledby={headingId} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 id={headingId} className="text-lg font-semibold">
                {mealType === "snack" ? t.planner.snacksTitle : t.mealTypes[mealType]}
              </h3>
              {slot.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => onAdd(mealType)}>
                  <Icon name="plus" className="size-4" />
                  {t.planner.add[mealType]}
                </Button>
              ) : null}
            </div>
            {slot.length > 0 ? (
              <ol className="flex flex-col gap-3">
                {slot.map((meal, index) => (
                  <li key={meal.id}>
                    <PlannedMealItem
                      meal={meal}
                      isFirst={index === 0}
                      isLast={index === slot.length - 1}
                      onSwap={() => onSwap(meal.id)}
                      onDuplicate={() => onDuplicate(meal.id)}
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border-2 border-dashed border-line px-4 py-3">
                <p className="text-ink-muted">{t.planner.emptySlot}</p>
                <Button variant="secondary" size="sm" onClick={() => onAdd(mealType)}>
                  <Icon name="plus" className="size-4" />
                  {t.planner.add[mealType]}
                </Button>
              </div>
            )}
          </section>
        );
      })}
    </section>
  );
}
