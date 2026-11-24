import type { MealType } from "@/lib/recipes/schema";

/** Stable id for a slot's "Add …" button, present whether or not the slot is empty. */
export const slotAddButtonId = (date: string, mealType: MealType) => `add-${date}-${mealType}`;

/**
 * After a meal is added or removed, the control that had focus may no longer
 * exist. Put focus on the slot's "Add …" button once the DOM has updated.
 */
export function focusSlotAddButton(date: string, mealType: MealType) {
  requestAnimationFrame(() => document.getElementById(slotAddButtonId(date, mealType))?.focus());
}
