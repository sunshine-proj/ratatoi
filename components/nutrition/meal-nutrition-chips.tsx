import { Tag } from "@/components/ui/tag";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";
import type { MealNutrition } from "@/lib/nutrition/totals";

/** Protein and calorie chips for one planned meal at its planned servings. */
export function MealNutritionChips({ nutrition }: { nutrition: MealNutrition | null }) {
  const t = getMessages();
  if (!nutrition) return <p className="text-sm text-ink-muted">{t.planner.noNutrition}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      <li>
        <Tag tone="protein">{formatMessage(t.recipes.card.protein, { g: formatNumber(nutrition.proteinG) })}</Tag>
      </li>
      <li>
        <Tag tone="energy">{formatMessage(t.recipes.card.kcal, { kcal: formatNumber(nutrition.kcal) })}</Tag>
      </li>
    </ul>
  );
}
