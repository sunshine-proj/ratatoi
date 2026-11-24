import { z } from "zod";
import { nutritionGoalSchema, type NutritionGoal } from "@/lib/nutrition/goal";
import { defaultPreferences, userPreferencesSchema, type UserPreferences } from "@/lib/preferences/preferences";
import { createLocalDocument } from "@/lib/storage/local-document";

/**
 * Everything the guest user has set up, stored as one versioned document.
 * Profile details used for estimates (age, sex, height, weight, activity)
 * are deliberately NOT part of this document.
 *
 * Bump `version` and add a migration when the shape changes.
 */
export const SETTINGS_STORAGE_KEY = "protein-plate:settings";

export const userSettingsSchema = z.object({
  version: z.literal(1),
  goal: nutritionGoalSchema.nullable(),
  preferences: userPreferencesSchema,
  onboardingCompletedAt: z.iso.datetime().nullable(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

export const emptySettings: UserSettings = {
  version: 1,
  goal: null,
  preferences: defaultPreferences,
  onboardingCompletedAt: null,
};

export const settingsDocument = createLocalDocument(SETTINGS_STORAGE_KEY, userSettingsSchema);

export function withGoal(settings: UserSettings, goal: NutritionGoal | null): UserSettings {
  return { ...settings, goal };
}

export function withPreferences(settings: UserSettings, preferences: UserPreferences): UserSettings {
  return { ...settings, preferences };
}

export function completeOnboarding(
  settings: UserSettings,
  input: { goal: NutritionGoal; preferences: UserPreferences; now?: Date },
): UserSettings {
  return {
    ...settings,
    goal: input.goal,
    preferences: input.preferences,
    onboardingCompletedAt: (input.now ?? new Date()).toISOString(),
  };
}
