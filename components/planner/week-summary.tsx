"use client";

import { Icon } from "@/components/ui/icon";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatNumber, formatPlural } from "@/lib/i18n/format";
import type { DailyTargets } from "@/lib/nutrition/goal";
import { summarizeRange } from "@/lib/nutrition/totals";
import type { MealPlan } from "@/lib/planner/schema";
import { useRecipeLookup } from "./recipe-lookup";

/** Totals and daily averages for exactly the selected week. */
export function WeekSummary({ plan, week, targets }: {
  plan: MealPlan;
  week: readonly string[];
  targets: DailyTargets | null;
}) {
  const t = getMessages();
  const w = t.week;
  const lookup = useRecipeLookup();
  const summary = summarizeRange(plan.meals, week, lookup.nutrition);

  return (
    <details className="group rounded-card border border-line bg-surface">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-card px-4 py-2 font-semibold [&::-webkit-details-marker]:hidden">
        {w.title}
        <Icon name="chevronDown" className="size-5 text-ink-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-1.5 px-4 pb-4 text-sm">
        {summary.dailyAverage ? (
          <>
            <p className="font-medium">
              {formatMessage(w.total, {
                kcal: formatNumber(summary.totals.kcal),
                protein: formatNumber(summary.totals.proteinG),
              })}
            </p>
            <p>
              {formatPlural(w.average, summary.plannedDays, {
                kcal: formatNumber(summary.dailyAverage.kcal),
                protein: formatNumber(summary.dailyAverage.proteinG),
              })}
            </p>
            {targets ? (
              <p className="text-ink-muted">
                {formatMessage(w.targets, {
                  kcal: formatNumber(targets.dailyCalorieTargetKcal),
                  protein: formatNumber(targets.dailyProteinTargetG),
                })}
              </p>
            ) : null}
            <p className="text-ink-muted">{w.averageNote}</p>
            {summary.totals.unknownMeals > 0 ? (
              <p className="text-ink-muted">{formatPlural(w.unknownMeals, summary.totals.unknownMeals)}</p>
            ) : null}
          </>
        ) : (
          <p className="text-ink-muted">{w.empty}</p>
        )}
      </div>
    </details>
  );
}
