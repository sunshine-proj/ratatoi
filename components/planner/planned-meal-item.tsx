"use client";

import { Link } from "@/components/ui/link";
import { useRef } from "react";
import { MealNutritionChips } from "@/components/nutrition/meal-nutrition-chips";
import { RecipeImage } from "@/components/recipes/recipe-image";
import { Icon, type IconName } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import { formatMessage, type Messages } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { routes } from "@/lib/navigation";
import { plannedMealNutrition } from "@/lib/nutrition/totals";
import { moveMeal, removeMeal, restoreMeal, setServings } from "@/lib/planner/operations";
import type { PlannedMeal } from "@/lib/planner/schema";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import { focusSlotAddButton } from "./slot-focus";
import { useRecipeLookup } from "./recipe-lookup";
import { ServingsStepper } from "./servings-stepper";
import { usePlanActions } from "./use-plan-actions";

export function plannedMealName(
  meal: PlannedMeal,
  getRecipe: (slug: string) => RecipeSummary | undefined,
  t: Messages,
): string {
  if (meal.kind === "custom") return meal.name;
  return getRecipe(meal.recipeSlug)?.name ?? t.planner.missingRecipe;
}

export function PlannedMealItem({ meal, isFirst, isLast, onSwap, onDuplicate }: {
  meal: PlannedMeal;
  isFirst: boolean;
  isLast: boolean;
  onSwap: () => void;
  onDuplicate: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const lookup = useRecipeLookup();
  const { apply } = usePlanActions();
  const menu = useRef<HTMLDetailsElement>(null);

  const recipe = meal.kind === "recipe" ? lookup.get(meal.recipeSlug) : undefined;
  const name = plannedMealName(meal, lookup.get, t);
  const nutrition = plannedMealNutrition(meal, lookup.nutrition);

  function remove() {
    const removed = meal;
    if (!apply((plan) => removeMeal(plan, meal.id))) return;
    // This row (and its focused Remove button) is gone; keep keyboard users in the slot.
    focusSlotAddButton(meal.date, meal.mealType);
    toast.show({
      message: formatMessage(t.planner.removed, { name }),
      action: { label: t.planner.undo, onClick: () => apply((plan) => restoreMeal(plan, removed)) },
    });
  }

  function runMenu(action: () => void) {
    if (menu.current) menu.current.open = false;
    action();
  }

  return (
    <article className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-card">
      <div className="flex items-start gap-3">
        {meal.kind === "recipe" && recipe ? (
          <RecipeImage image={recipe.image} mealType={meal.mealType} sizes="80px" className="w-20 shrink-0 rounded-control" />
        ) : (
          <span
            aria-hidden="true"
            className="flex aspect-[4/3] w-20 shrink-0 items-center justify-center rounded-control bg-surface-muted text-ink-muted"
          >
            <Icon name={meal.kind === "custom" ? "utensils" : "alert"} className="size-6" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h4 className="leading-snug font-semibold">
            {recipe ? (
              <Link href={routes.recipe(recipe.slug)} className="hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
          </h4>
          {meal.kind === "custom" ? (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
              <Tag className="text-xs">{t.planner.customBadge}</Tag>
              {t.planner.customNote}
            </p>
          ) : null}
          <MealNutritionChips nutrition={nutrition} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ServingsStepper
          value={meal.servings}
          itemName={name}
          onChange={(servings) => apply((plan, ctx) => setServings(plan, meal.id, servings, ctx))}
        />
        <div className="ml-auto flex items-center gap-1">
          <ActionButton icon="swap" label={t.planner.swap} onClick={onSwap} name={name} />
          <ActionButton icon="trash" label={t.planner.remove} onClick={remove} name={name} />
          <details ref={menu} className="relative">
            <summary
              aria-label={formatMessage(t.planner.actionsFor, { name })}
              className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted [&::-webkit-details-marker]:hidden"
            >
              <Icon name="dots" className="size-5" />
            </summary>
            <div className="absolute right-0 z-20 mt-1 flex min-w-44 flex-col rounded-control border border-line bg-surface p-1 shadow-raised">
              <MenuButton icon="copy" onClick={() => runMenu(onDuplicate)}>
                {t.planner.duplicate}
              </MenuButton>
              <MenuButton icon="arrowUp" disabled={isFirst} onClick={() => runMenu(() => apply((plan) => moveMeal(plan, meal.id, "up")))}>
                {t.planner.moveUp}
              </MenuButton>
              <MenuButton icon="arrowDown" disabled={isLast} onClick={() => runMenu(() => apply((plan) => moveMeal(plan, meal.id, "down")))}>
                {t.planner.moveDown}
              </MenuButton>
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

function ActionButton({ icon, label, name, onClick }: { icon: IconName; label: string; name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${name}`}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2.5 text-sm font-medium text-primary hover:bg-primary-soft"
    >
      <Icon name={icon} className="size-5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function MenuButton({ icon, onClick, disabled, children }: {
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-11 items-center gap-2 rounded-control px-3 text-left text-sm hover:bg-surface-muted disabled:opacity-40"
    >
      <Icon name={icon} className="size-4" />
      {children}
    </button>
  );
}
