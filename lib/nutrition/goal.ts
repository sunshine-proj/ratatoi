import { z } from "zod";
import { parseNumberField, numberToInput, type FieldError } from "@/lib/forms/number-field";
import { isoDate } from "@/lib/validation";

export const goalTypes = ["fat_loss", "muscle_gain", "healthy_eating"] as const;
export type GoalType = (typeof goalTypes)[number];

export const targetSources = ["manual", "estimate"] as const;
export type TargetSource = (typeof targetSources)[number];

/**
 * Sanity limits for daily targets. They catch typos (e.g. 19000 kcal), not
 * judge choices; anything unusual but plausible gets a gentle notice instead.
 */
export const TARGET_LIMITS = {
  calories: { min: 800, max: 6000 },
  protein: { min: 20, max: 400 },
  carbs: { min: 0, max: 1000 },
  fat: { min: 0, max: 400 },
} as const;

/** Below this, show a neutral suggestion to check with a professional. */
export const LOW_CALORIE_NOTICE_KCAL = 1200;

const target = (limits: { min: number; max: number }) => z.number().int().min(limits.min).max(limits.max);

export const nutritionGoalSchema = z.object({
  goalType: z.enum(goalTypes),
  dailyCalorieTargetKcal: target(TARGET_LIMITS.calories),
  dailyProteinTargetG: target(TARGET_LIMITS.protein),
  dailyCarbsTargetG: target(TARGET_LIMITS.carbs).nullable(),
  dailyFatTargetG: target(TARGET_LIMITS.fat).nullable(),
  /** Whether the user started from an estimate. Either way, the user chose the numbers. */
  targetSource: z.enum(targetSources),
  effectiveFrom: isoDate,
  updatedAt: z.iso.datetime(),
});

export type NutritionGoal = z.infer<typeof nutritionGoalSchema>;

export type DailyTargets = Pick<
  NutritionGoal,
  "dailyCalorieTargetKcal" | "dailyProteinTargetG" | "dailyCarbsTargetG" | "dailyFatTargetG"
>;

// ---------------------------------------------------------------------------
// Form handling
// ---------------------------------------------------------------------------

export type TargetsDraft = { calories: string; protein: string; carbs: string; fat: string };
export type TargetsField = keyof TargetsDraft;
export type TargetsErrors = Partial<Record<TargetsField, FieldError>>;

export const emptyTargetsDraft: TargetsDraft = { calories: "", protein: "", carbs: "", fat: "" };

export function targetsToDraft(goal: DailyTargets | null | undefined): TargetsDraft {
  if (!goal) return emptyTargetsDraft;
  return {
    calories: numberToInput(goal.dailyCalorieTargetKcal),
    protein: numberToInput(goal.dailyProteinTargetG),
    carbs: numberToInput(goal.dailyCarbsTargetG),
    fat: numberToInput(goal.dailyFatTargetG),
  };
}

export function parseTargets(
  draft: TargetsDraft,
): { ok: true; value: DailyTargets } | { ok: false; errors: TargetsErrors } {
  const calories = parseNumberField(draft.calories, { ...TARGET_LIMITS.calories, integer: true, required: true });
  const protein = parseNumberField(draft.protein, { ...TARGET_LIMITS.protein, integer: true, required: true });
  const carbs = parseNumberField(draft.carbs, { ...TARGET_LIMITS.carbs, integer: true });
  const fat = parseNumberField(draft.fat, { ...TARGET_LIMITS.fat, integer: true });

  const errors: TargetsErrors = {};
  if (!calories.ok) errors.calories = calories.error;
  if (!protein.ok) errors.protein = protein.error;
  if (!carbs.ok) errors.carbs = carbs.error;
  if (!fat.ok) errors.fat = fat.error;

  if (!calories.ok || !protein.ok || !carbs.ok || !fat.ok) return { ok: false, errors };

  return {
    ok: true,
    value: {
      // Required fields cannot be null once parsed successfully.
      dailyCalorieTargetKcal: calories.value!,
      dailyProteinTargetG: protein.value!,
      dailyCarbsTargetG: carbs.value,
      dailyFatTargetG: fat.value,
    },
  };
}

export function buildGoal(input: {
  goalType: GoalType;
  targets: DailyTargets;
  targetSource: TargetSource;
  effectiveFrom: string;
  now?: Date;
}): NutritionGoal {
  return nutritionGoalSchema.parse({
    goalType: input.goalType,
    ...input.targets,
    targetSource: input.targetSource,
    effectiveFrom: input.effectiveFrom,
    updatedAt: (input.now ?? new Date()).toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Gentle, non-blocking notices
// ---------------------------------------------------------------------------

/** Energy implied by macro targets (4 kcal/g protein and carbs, 9 kcal/g fat). */
export function macroEnergyKcal(targets: Pick<DailyTargets, "dailyProteinTargetG" | "dailyCarbsTargetG" | "dailyFatTargetG">): number {
  return targets.dailyProteinTargetG * 4 + (targets.dailyCarbsTargetG ?? 0) * 4 + (targets.dailyFatTargetG ?? 0) * 9;
}

export type TargetNotices = {
  lowCalories: boolean;
  /** Implied macro energy when it exceeds the calorie target by more than 10%; otherwise null. */
  macroEnergyOverCalories: number | null;
};

export function targetNotices(targets: DailyTargets): TargetNotices {
  const macroKcal = macroEnergyKcal(targets);
  return {
    lowCalories: targets.dailyCalorieTargetKcal < LOW_CALORIE_NOTICE_KCAL,
    macroEnergyOverCalories: macroKcal > targets.dailyCalorieTargetKcal * 1.1 ? Math.round(macroKcal) : null,
  };
}
