"use client";

import { ProgressPanel } from "@/components/nutrition/progress-panel";
import { Button } from "@/components/ui/button";
import { DelayedAnnouncement } from "@/components/ui/delayed-announcement";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { DailyTargets } from "@/lib/nutrition/goal";
import { sumNutrition } from "@/lib/nutrition/totals";
import { mealsInSlot, mealsOn } from "@/lib/planner/operations";
import type { MealPlan } from "@/lib/planner/schema";
import { mealTypes, type MealType } from "@/lib/recipes/schema";
import { DAY_PANEL_ID, dayTabId } from "./day-tabs";
import { PlannedMealItem } from "./planned-meal-item";
import { slotAddButtonId } from "./slot-focus";
import { useRecipeLookup } from "./recipe-lookup";

export function DayPlan({ plan, date, today, targets, onAdd, onSwap, onDuplicate, onClearDay }: {
  plan: MealPlan;
  targets: DailyTargets | null;
  date: string;
  today: string;
  onAdd: (mealType: MealType) => void;
  onSwap: (mealId: string) => void;
  onDuplicate: (mealId: string) => void;
  onClearDay: () => void;
}) {
  const { t, locale } = useI18n();
  const lookup = useRecipeLookup();
  const meals = mealsOn(plan, date);
  const totals = sumNutrition(meals, lookup.nutrition);

  return (
    <section id={DAY_PANEL_ID} role="tabpanel" aria-labelledby={dayTabId(date)} className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold">
          {formatDate(date, "dayLong", locale)}
          {date === today ? (
            <>
              {" "}
              <span className="ml-1 align-middle text-sm font-medium text-primary">· {t.planner.today}</span>
            </>
          ) : null}
        </h2>
        {meals.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={onClearDay}>
            {t.planner.clearDay}
          </Button>
        ) : null}
      </header>

      {meals.length > 0 ? (
        <ProgressPanel
          totals={totals}
          targets={targets}
          headingId={`progress-${date}`}
          heading={t.progress.title}
        />
      ) : (
        <p className="text-ink-muted">{t.planner.emptyDay}</p>
      )}
      <DelayedAnnouncement
        message={formatMessage(t.progress.announce, { kcal: formatNumber(totals.kcal, locale), protein: formatNumber(totals.proteinG, locale) })}
      />

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
                <Button id={slotAddButtonId(date, mealType)} variant="ghost" size="sm" onClick={() => onAdd(mealType)}>
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
                <Button id={slotAddButtonId(date, mealType)} variant="secondary" size="sm" onClick={() => onAdd(mealType)}>
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
