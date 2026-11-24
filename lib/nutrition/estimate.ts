import { parseNumberField, type FieldError } from "@/lib/forms/number-field";
import type { GoalType } from "./goal";

/**
 * Transparent starting-point estimate for daily targets.
 *
 * - Resting energy: Mifflin–St Jeor (1990).
 * - Maintenance: resting energy × a standard activity factor.
 * - Goal adjustment: a moderate −15% for fat loss, +10% for muscle gain.
 * - Protein: grams per kg of body weight, by goal.
 *
 * Safety rails: never suggest below MIN_SUGGESTED_KCAL, and cap protein at
 * PROTEIN_MAX_ENERGY_SHARE of the suggested calories. These are planning
 * estimates, not medical advice; the user always reviews and edits them.
 *
 * Profile details are inputs only: nothing here is persisted.
 */

export const sexOptions = ["female", "male", "unspecified"] as const;
export type Sex = (typeof sexOptions)[number];

export const activityLevels = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export type ActivityLevel = (typeof activityLevels)[number];

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin–St Jeor sex constant. "unspecified" uses the midpoint of the two. */
export const SEX_CONSTANT_KCAL: Record<Sex, number> = { male: 5, female: -161, unspecified: -78 };

export const GOAL_ENERGY_ADJUSTMENT: Record<GoalType, number> = {
  fat_loss: -0.15,
  muscle_gain: 0.1,
  healthy_eating: 0,
};

export const PROTEIN_G_PER_KG: Record<GoalType, number> = {
  fat_loss: 1.8,
  muscle_gain: 1.8,
  healthy_eating: 1.4,
};

export const MIN_SUGGESTED_KCAL = 1200;
export const PROTEIN_MAX_ENERGY_SHARE = 0.35;

export const PROFILE_LIMITS = {
  age: { min: 18, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 300 },
} as const;

export type Profile = {
  ageYears: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
};

export type Estimate = {
  calories: number;
  protein: number;
  restingKcal: number;
  maintenanceKcal: number;
  energyAdjustment: number;
  proteinGPerKg: number;
  /** True when the goal adjustment would have gone below MIN_SUGGESTED_KCAL. */
  flooredAtMinimum: boolean;
  /** True when protein was reduced to stay within PROTEIN_MAX_ENERGY_SHARE. */
  proteinCapped: boolean;
};

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function restingEnergyKcal(profile: Pick<Profile, "ageYears" | "sex" | "heightCm" | "weightKg">): number {
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears + SEX_CONSTANT_KCAL[profile.sex];
}

export function estimateTargets(profile: Profile, goalType: GoalType): Estimate {
  const resting = restingEnergyKcal(profile);
  const maintenance = resting * ACTIVITY_FACTORS[profile.activity];
  const adjustment = GOAL_ENERGY_ADJUSTMENT[goalType];
  const adjusted = maintenance * (1 + adjustment);

  const flooredAtMinimum = adjusted < MIN_SUGGESTED_KCAL;
  const calories = Math.max(MIN_SUGGESTED_KCAL, roundTo(adjusted, 50));

  const proteinGPerKg = PROTEIN_G_PER_KG[goalType];
  const proteinFromWeight = profile.weightKg * proteinGPerKg;
  const proteinCeiling = (calories * PROTEIN_MAX_ENERGY_SHARE) / 4;
  const proteinCapped = proteinFromWeight > proteinCeiling;
  // Round down to 5 g when capped so the cap is never exceeded.
  const protein = proteinCapped
    ? Math.floor(proteinCeiling / 5) * 5
    : roundTo(proteinFromWeight, 5);

  return {
    calories,
    protein,
    restingKcal: Math.round(resting),
    maintenanceKcal: roundTo(maintenance, 50),
    energyAdjustment: adjustment,
    proteinGPerKg,
    flooredAtMinimum,
    proteinCapped,
  };
}

// ---------------------------------------------------------------------------
// Form handling
// ---------------------------------------------------------------------------

export type ProfileDraft = {
  age: string;
  height: string;
  weight: string;
  sex: Sex | null;
  activity: ActivityLevel | null;
};
export type ProfileField = keyof ProfileDraft;
export type ProfileErrors = Partial<Record<ProfileField, FieldError>>;

export const emptyProfileDraft: ProfileDraft = { age: "", height: "", weight: "", sex: null, activity: null };

export function parseProfile(draft: ProfileDraft): { ok: true; value: Profile } | { ok: false; errors: ProfileErrors } {
  const errors: ProfileErrors = {};

  // Parse age with a wide range first, so under-18s get the specific
  // "designed for adults" message rather than a generic range error.
  const age = parseNumberField(draft.age, { min: 0, max: PROFILE_LIMITS.age.max, integer: true, required: true });
  if (!age.ok) {
    errors.age = age.error.code === "outOfRange" ? { code: "outOfRange", ...PROFILE_LIMITS.age } : age.error;
  } else if (age.value !== null && age.value < PROFILE_LIMITS.age.min) {
    errors.age = { code: "adultsOnly" };
  }

  const height = parseNumberField(draft.height, { ...PROFILE_LIMITS.heightCm, required: true });
  if (!height.ok) errors.height = height.error;

  const weight = parseNumberField(draft.weight, { ...PROFILE_LIMITS.weightKg, required: true });
  if (!weight.ok) errors.weight = weight.error;

  if (!draft.sex) errors.sex = { code: "required" };
  if (!draft.activity) errors.activity = { code: "required" };

  if (!age.ok || !height.ok || !weight.ok || !draft.sex || !draft.activity || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      // Required fields are non-null after a successful parse.
      ageYears: age.value!,
      heightCm: height.value!,
      weightKg: weight.value!,
      sex: draft.sex,
      activity: draft.activity,
    },
  };
}
