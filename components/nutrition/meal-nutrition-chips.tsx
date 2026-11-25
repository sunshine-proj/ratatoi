"use client";

import { Tag } from "@/components/ui/tag";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber } from "@/lib/i18n/format";
import type { MealNutrition } from "@/lib/nutrition/totals";

/** Protein and calorie chips for one planned meal at its planned servings. */
export function MealNutritionChips({ nutrition }: { nutrition: MealNutrition | null }) {
  const { t, locale } = useI18n();
  if (!nutrition) return <p className="text-sm text-ink-muted">{t.planner.noNutrition}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      <li>
        <Tag tone="protein">{formatMessage(t.recipes.card.protein, { g: formatNumber(nutrition.proteinG, locale) })}</Tag>
      </li>
      <li>
        <Tag tone="energy">{formatMessage(t.recipes.card.kcal, { kcal: formatNumber(nutrition.kcal, locale) })}</Tag>
      </li>
    </ul>
  );
}
