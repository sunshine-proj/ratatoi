import type { DailyTargets } from "./goal";
import type { NutritionTotals } from "./totals";

/**
 * Progress against daily targets.
 *
 * Remaining = target − planned. Negative remaining is allowed and described
 * neutrally ("above target"); nothing here judges a choice.
 *
 * Full precision is kept in `planned` and `remaining`. For display, planned
 * is rounded once and the displayed remaining is derived from that rounded
 * value, so the two numbers shown always add up to the target
 * (e.g. 1,700 planned + 200 remaining = 1,900, never 1,700 + 201).
 */
export const progressMetrics = ["kcal", "proteinG", "carbsG", "fatG"] as const;
export type ProgressMetric = (typeof progressMetrics)[number];

export type ProgressState = "below" | "met" | "above";

export type MetricProgress = {
  metric: ProgressMetric;
  target: number;
  /** Null when some planned meals have no information for this metric. */
  planned: number | null;
  remaining: number | null;
  displayPlanned: number | null;
  displayRemaining: number | null;
  /** planned / target, not capped (1.2 = 20% above target). */
  ratio: number | null;
  state: ProgressState | null;
};

function metricTarget(targets: DailyTargets, metric: ProgressMetric): number | null {
  switch (metric) {
    case "kcal":
      return targets.dailyCalorieTargetKcal;
    case "proteinG":
      return targets.dailyProteinTargetG;
    case "carbsG":
      return targets.dailyCarbsTargetG;
    case "fatG":
      return targets.dailyFatTargetG;
  }
}

export function metricProgress(metric: ProgressMetric, target: number, planned: number | null): MetricProgress {
  if (planned === null) {
    return { metric, target, planned: null, remaining: null, displayPlanned: null, displayRemaining: null, ratio: null, state: null };
  }
  if (planned < 0 || target < 0) throw new Error("Planned and target values must be non-negative");
  const displayPlanned = Math.round(planned);
  const displayRemaining = Math.round(target) - displayPlanned;
  return {
    metric,
    target,
    planned,
    remaining: target - planned,
    displayPlanned,
    displayRemaining,
    ratio: target > 0 ? planned / target : null,
    state: displayRemaining > 0 ? "below" : displayRemaining === 0 ? "met" : "above",
  };
}

/**
 * Progress for calories and protein, plus carbohydrate and fat when the user
 * has set those optional targets.
 */
export function dayProgress(totals: NutritionTotals, targets: DailyTargets): MetricProgress[] {
  return progressMetrics.flatMap((metric) => {
    const target = metricTarget(targets, metric);
    if (target === null) return [];
    // Calories and protein are summed from every meal with nutrition; meals
    // with none at all are reported separately (totals.unknownMeals).
    // Carbohydrate and fat are null (unknown) if any meal lacks them.
    return [metricProgress(metric, target, totals[metric])];
  });
}
