/**
 * Example starting points for snack discovery. They are offered as one-tap
 * presets, never applied automatically, and the user can edit both numbers.
 * There is no single definition of "low calorie" for everyone.
 */
export const snackPresets = [
  { id: "150-15", caloriesMaxKcal: 150, proteinMinG: 15 },
  { id: "200-20", caloriesMaxKcal: 200, proteinMinG: 20 },
  { id: "250-25", caloriesMaxKcal: 250, proteinMinG: 25 },
] as const;

export type SnackPreset = (typeof snackPresets)[number];

/** Time options for the "Ready in" filter, in minutes. */
export const timeFilterOptions = [10, 15, 20, 30, 45, 60] as const;
