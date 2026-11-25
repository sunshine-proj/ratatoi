"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatMessage, type Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber } from "@/lib/i18n/format";
import { sumNutrition } from "@/lib/nutrition/totals";
import { findMeal, mealContent, mealsOn, replaceMeal } from "@/lib/planner/operations";
import type { MealPlan, PlannedMeal } from "@/lib/planner/schema";
import { useRecipeLookup } from "./recipe-lookup";
import { RecipePicker } from "./recipe-picker";
import { usePlanActions } from "./use-plan-actions";
import { plannedMealName } from "./planned-meal-item";

/** Signed, neutral change: "+80 kcal", "−12 g", or "no change". */
function delta(value: number, unit: string, none: string, locale: Locale): string {
  const rounded = Math.round(value);
  if (rounded === 0) return none;
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded), locale)} ${unit}`;
}

export function SwapMealDialog({ mealId, onClose }: { mealId: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const s = t.planner.swapDialog;
  const toast = useToast();
  const { plan, apply } = usePlanActions();
  const lookup = useRecipeLookup();
  const meal = plan && mealId ? findMeal(plan, mealId) : undefined;

  return (
    <Dialog
      open={Boolean(meal)}
      onClose={onClose}
      variant="sheet"
      className="max-w-2xl"
      title={meal ? formatMessage(s.title, { name: plannedMealName(meal, lookup.get, t) }) : ""}
      description={s.intro}
    >
      {meal && plan ? (
        <SwapOptions
          plan={plan}
          meal={meal}
          onSwap={(slug, name) => {
            const previous = meal;
            const ok = apply((current, ctx) => replaceMeal(current, meal.id, { kind: "recipe", recipeSlug: slug }, ctx));
            if (!ok) return;
            onClose();
            toast.show({
              message: formatMessage(s.swapped, { name }),
              tone: "success",
              action: {
                label: t.planner.undo,
                // Swap the original back in (a no-op if the meal was removed meanwhile).
                onClick: () => apply((current, ctx) => replaceMeal(current, previous.id, mealContent(previous), ctx)),
              },
            });
          }}
        />
      ) : null}
    </Dialog>
  );
}

function SwapOptions({ plan, meal, onSwap }: {
  plan: MealPlan;
  meal: PlannedMeal;
  onSwap: (slug: string, name: string) => void;
}) {
  const { t, locale } = useI18n();
  const s = t.planner.swapDialog;
  const lookup = useRecipeLookup();
  const now = sumNutrition(mealsOn(plan, meal.date), lookup.nutrition);

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-control bg-surface-muted px-3 py-2 font-medium">
        {formatMessage(s.dayNow, { kcal: formatNumber(now.kcal, locale), protein: formatNumber(now.proteinG, locale) })}
      </p>
      <RecipePicker
        mealType={meal.mealType}
        excludeSlug={meal.kind === "recipe" ? meal.recipeSlug : undefined}
        detail={(recipe) => {
          const swapped = replaceMeal(plan, meal.id, { kind: "recipe", recipeSlug: recipe.slug }, { now: new Date(0) });
          const after = sumNutrition(mealsOn(swapped, meal.date), lookup.nutrition);
          return formatMessage(s.after, {
            kcal: formatNumber(after.kcal, locale),
            kcalDelta: delta(after.kcal - now.kcal, "kcal", s.noChange, locale),
            protein: formatNumber(after.proteinG, locale),
            proteinDelta: delta(after.proteinG - now.proteinG, "g", s.noChange, locale),
          });
        }}
        action={(recipe) => (
          <Button size="sm" variant="secondary" onClick={() => onSwap(recipe.slug, recipe.name)} aria-label={formatMessage(s.swapIn, { name: recipe.name })}>
            {t.planner.swap}
          </Button>
        )}
      />
    </div>
  );
}
