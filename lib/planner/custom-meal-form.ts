import type { Locale } from "@/lib/i18n";
import { parseNumberField, type FieldError } from "@/lib/forms/number-field";
import { CUSTOM_NAME_MAX, type CustomMealNutrition } from "./schema";

export type CustomMealDraft = { name: string; kcal: string; protein: string; carbs: string; fat: string };
export type CustomMealField = keyof CustomMealDraft;
export type CustomMealErrors = Partial<Record<CustomMealField, FieldError>>;

export const emptyCustomMealDraft: CustomMealDraft = { name: "", kcal: "", protein: "", carbs: "", fat: "" };

/** Name, calories, and protein are required; carbohydrate and fat may be left unknown. */
export function parseCustomMeal(
  draft: CustomMealDraft,
  locale: Locale = "en",
): { ok: true; value: { name: string; nutritionPerServing: CustomMealNutrition } } | { ok: false; errors: CustomMealErrors } {
  const errors: CustomMealErrors = {};
  const name = draft.name.trim().replace(/\s+/g, " ");
  if (name === "") errors.name = { code: "required" };
  else if (name.length > CUSTOM_NAME_MAX) errors.name = { code: "tooLong", max: CUSTOM_NAME_MAX };

  const kcal = parseNumberField(draft.kcal, { min: 0, max: 5000, required: true, locale });
  const protein = parseNumberField(draft.protein, { min: 0, max: 500, required: true, locale });
  const carbs = parseNumberField(draft.carbs, { min: 0, max: 1000, locale });
  const fat = parseNumberField(draft.fat, { min: 0, max: 500, locale });
  if (!kcal.ok) errors.kcal = kcal.error;
  if (!protein.ok) errors.protein = protein.error;
  if (!carbs.ok) errors.carbs = carbs.error;
  if (!fat.ok) errors.fat = fat.error;

  if (!kcal.ok || !protein.ok || !carbs.ok || !fat.ok || errors.name) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      nutritionPerServing: { kcal: kcal.value!, proteinG: protein.value!, carbsG: carbs.value, fatG: fat.value },
    },
  };
}
