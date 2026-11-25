"use client";

import { Tag } from "@/components/ui/tag";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber } from "@/lib/i18n/format";
import type { DailyTargets, TargetSource } from "@/lib/nutrition/goal";
import type { UserPreferences } from "@/lib/preferences/preferences";

export function TargetsSummary({ targets, source }: { targets: DailyTargets; source?: TargetSource }) {
  const { t, locale } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2" aria-label={t.targets.legend}>
        <li>
          <Tag tone="energy">
            {formatMessage(t.targets.summaryCalories, { kcal: formatNumber(targets.dailyCalorieTargetKcal, locale) })}
          </Tag>
        </li>
        <li>
          <Tag tone="protein">
            {formatMessage(t.targets.summaryProtein, { g: formatNumber(targets.dailyProteinTargetG, locale) })}
          </Tag>
        </li>
        {targets.dailyCarbsTargetG !== null ? (
          <li>
            <Tag>{formatMessage(t.targets.summaryCarbs, { g: formatNumber(targets.dailyCarbsTargetG, locale) })}</Tag>
          </li>
        ) : null}
        {targets.dailyFatTargetG !== null ? (
          <li>
            <Tag>{formatMessage(t.targets.summaryFat, { g: formatNumber(targets.dailyFatTargetG, locale) })}</Tag>
          </li>
        ) : null}
      </ul>
      {source ? (
        <p className="text-sm text-ink-muted">
          {source === "estimate" ? t.targets.sourceEstimate : t.targets.sourceManual}
        </p>
      ) : null}
    </div>
  );
}

export function PreferencesSummary({ preferences }: { preferences: UserPreferences }) {
  const { t } = useI18n();
  const list = (items: readonly string[]) => (items.length ? items.join(", ") : t.common.none);

  const rows: Array<[string, string]> = [
    [t.preferences.patterns.legend, list(preferences.dietaryPatterns.map((p) => t.preferences.patterns[p]))],
    [t.preferences.allergens.legend, list(preferences.allergens.map((a) => t.preferences.allergens[a]))],
    [t.preferences.excluded.label, list(preferences.excludedIngredients)],
    [
      t.preferences.skill.legend,
      preferences.cookingSkill ? t.preferences.skill[preferences.cookingSkill].label : t.common.notSet,
    ],
    [t.preferences.budget.legend, preferences.budget ? t.preferences.budget[preferences.budget].label : t.common.notSet],
    [
      t.preferences.meals.legend,
      formatMessage(t.onboarding.summaryMeals, { main: preferences.mainMealsPerDay, snacks: preferences.snacksPerDay }),
    ],
  ];

  return (
    <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="mb-1 sm:mb-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
