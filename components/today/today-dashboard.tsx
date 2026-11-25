"use client";

import { Link } from "@/components/ui/link";
import { MealNutritionChips } from "@/components/nutrition/meal-nutrition-chips";
import { ProgressPanel } from "@/components/nutrition/progress-panel";
import { RecipeLookupProvider, useRecipeLookup } from "@/components/planner/recipe-lookup";
import { plannedMealName } from "@/components/planner/planned-meal-item";
import { SettingsGate } from "@/components/settings/settings-gate";
import { DocumentGate } from "@/components/storage/document-gate";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { toLocalIsoDate } from "@/lib/dates";
import { useI18n } from "@/lib/i18n/client";
import { formatDate, formatPlural } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import { plannedMealNutrition, sumNutrition } from "@/lib/nutrition/totals";
import { mealsOn } from "@/lib/planner/operations";
import { emptyPlan, type MealPlan } from "@/lib/planner/schema";
import { usePlan } from "@/lib/planner/use-plan";
import { formatQuantity } from "@/lib/recipes/format";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import type { UserSettings } from "@/lib/settings/settings";

export function greetingFor(hour: number): "morning" | "afternoon" | "evening" {
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

/** Today: greeting, progress against targets, today's meals, quick actions. */
export function TodayDashboard({ recipes }: { recipes: RecipeSummary[] }) {
  const { t } = useI18n();
  const { state, reset } = usePlan();
  return (
    <RecipeLookupProvider recipes={recipes}>
      <SettingsGate>
        {(settings) => (
          <DocumentGate
            state={state}
            reset={reset}
            copy={{
              title: t.planner.loadFailedTitle,
              body: t.planner.loadFailedBody,
              reset: t.planner.reset,
              resetDone: t.planner.resetDone,
            }}
          >
            {(plan) => <Dashboard settings={settings} plan={plan ?? emptyPlan} />}
          </DocumentGate>
        )}
      </SettingsGate>
    </RecipeLookupProvider>
  );
}

function Dashboard({ settings, plan }: { settings: UserSettings | null; plan: MealPlan }) {
  const { t, locale } = useI18n();
  const lookup = useRecipeLookup();
  const now = new Date();
  const today = toLocalIsoDate(now);
  const meals = mealsOn(plan, today);
  const totals = sumNutrition(meals, lookup.nutrition);
  const goal = settings?.goal ?? null;
  const needsSetup = !settings?.onboardingCompletedAt && !goal;
  const planTodayHref = `${routes.planner}?date=${today}`;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg">
        <span className="font-semibold">{t.today.greeting[greetingFor(now.getHours())]}</span>
        <span className="text-ink-muted"> · {formatDate(today, "dayLong", locale)}</span>
      </p>

      {needsSetup ? (
        <Card as="section" aria-labelledby="today-setup-title" className="flex flex-col items-start gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-pill bg-primary-soft text-primary-strong">
            <Icon name="today" />
          </span>
          <h2 id="today-setup-title" className="text-2xl font-semibold">
            {t.pages.today.setupTitle}
          </h2>
          <p className="text-ink-muted">{t.pages.today.setupBody}</p>
          <Link href={routes.onboarding} className={buttonClasses({ size: "lg" })}>
            {t.pages.today.setupCta}
          </Link>
        </Card>
      ) : null}

      {goal || meals.length > 0 ? (
        <div className="flex flex-col gap-2">
          <ProgressPanel totals={totals} targets={goal} headingId="today-progress" heading={t.today.progressTitle} />
          {goal ? (
            <Link href={routes.goals} className="self-end text-sm font-medium text-primary underline underline-offset-2">
              {t.pages.today.editTargets}
            </Link>
          ) : null}
        </div>
      ) : null}

      <section aria-labelledby="today-meals-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="today-meals-title" className="text-2xl font-semibold">
            {t.today.mealsTitle}
          </h2>
          {meals.length > 0 ? (
            <Link href={planTodayHref} className={buttonClasses({ variant: "ghost", size: "sm" })}>
              {t.today.editPlan}
            </Link>
          ) : null}
        </div>
        {meals.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {meals.map((meal) => {
              const recipe = meal.kind === "recipe" ? lookup.get(meal.recipeSlug) : undefined;
              const name = plannedMealName(meal, lookup.get, t);
              return (
                <li key={meal.id} className="flex flex-col gap-2 rounded-control border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase sm:w-20 sm:shrink-0">
                    {t.mealTypes[meal.mealType]}
                  </span>
                  <span className="min-w-0 sm:flex-1">
                    {recipe ? (
                      <Link href={routes.recipe(recipe.slug)} className="font-semibold hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{name}</span>
                    )}
                    {meal.kind === "custom" ? <span className="ml-2 text-xs text-ink-muted">({t.planner.customBadge})</span> : null}
                    <span className="block text-sm text-ink-muted">
                      {formatPlural(t.planner.servings, meal.servings, locale, { count: formatQuantity(meal.servings, locale) })}
                    </span>
                  </span>
                  <MealNutritionChips nutrition={plannedMealNutrition(meal, lookup.nutrition)} />
                </li>
              );
            })}
          </ol>
        ) : (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-ink-muted">{t.today.noMeals}</p>
            <Link href={planTodayHref} className={buttonClasses()}>
              {t.today.planToday}
            </Link>
          </Card>
        )}
      </section>

      <nav aria-labelledby="quick-actions-title" className="flex flex-col gap-3">
        <h2 id="quick-actions-title" className="text-xl font-semibold">
          {t.today.quickActions}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <QuickAction href={planTodayHref} icon="plus" label={t.today.addMeal} />
          <QuickAction href={routes.snacks} icon="snacks" label={t.today.findSnack} />
          <QuickAction href={routes.shoppingList} icon="shopping" label={t.today.shoppingList} />
        </ul>
      </nav>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface px-4 font-medium shadow-card hover:bg-surface-muted"
      >
        <span className="inline-flex size-9 items-center justify-center rounded-pill bg-primary-soft text-primary-strong">
          <Icon name={icon} className="size-5" />
        </span>
        {label}
      </Link>
    </li>
  );
}
