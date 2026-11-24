import { mealTypes, type MealType } from "@/lib/recipes/schema";
import type { CustomMealNutrition, MealPlan, PlannedMeal } from "./schema";

/**
 * Pure meal-plan operations. Each returns a new plan and never mutates its
 * input. Positions stay contiguous (0, 1, 2…) within each date + meal-type
 * slot. `now` and `newId` are passed in so results are reproducible in tests.
 */
export type OpContext = { now: Date; newId: () => string };

export type MealContent =
  | { kind: "recipe"; recipeSlug: string }
  | { kind: "custom"; name: string; nutritionPerServing: CustomMealNutrition };

export type NewMeal = MealContent & { date: string; mealType: MealType; servings: number };

const slotKey = (meal: Pick<PlannedMeal, "date" | "mealType">) => `${meal.date}|${meal.mealType}`;

const mealTypeOrder = (type: MealType) => mealTypes.indexOf(type);

/** Stable order for display: date, then breakfast→snack, then position. */
export function compareMeals(a: PlannedMeal, b: PlannedMeal): number {
  return (
    a.date.localeCompare(b.date) ||
    mealTypeOrder(a.mealType) - mealTypeOrder(b.mealType) ||
    a.position - b.position ||
    a.id.localeCompare(b.id)
  );
}

/** Renumber positions 0..n-1 within every slot, keeping relative order. */
function normalize(meals: PlannedMeal[]): PlannedMeal[] {
  const sorted = [...meals].sort(compareMeals);
  const counters = new Map<string, number>();
  return sorted.map((meal) => {
    const key = slotKey(meal);
    const position = counters.get(key) ?? 0;
    counters.set(key, position + 1);
    return meal.position === position ? meal : { ...meal, position };
  });
}

function nextPosition(plan: MealPlan, date: string, mealType: MealType): number {
  return plan.meals.filter((meal) => meal.date === date && meal.mealType === mealType).length;
}

function withMeals(plan: MealPlan, meals: PlannedMeal[]): MealPlan {
  return { ...plan, meals: normalize(meals) };
}

function buildMeal(content: MealContent, fields: Omit<PlannedMeal, "kind" | "recipeSlug" | "name" | "nutritionPerServing">): PlannedMeal {
  return content.kind === "recipe"
    ? { ...fields, kind: "recipe", recipeSlug: content.recipeSlug }
    : { ...fields, kind: "custom", name: content.name.trim(), nutritionPerServing: content.nutritionPerServing };
}

/** What a planned meal contains, without its slot or servings. */
export function mealContent(meal: PlannedMeal): MealContent {
  return meal.kind === "recipe"
    ? { kind: "recipe", recipeSlug: meal.recipeSlug }
    : { kind: "custom", name: meal.name, nutritionPerServing: meal.nutritionPerServing };
}

export function findMeal(plan: MealPlan, id: string): PlannedMeal | undefined {
  return plan.meals.find((meal) => meal.id === id);
}

/** Add to the end of its slot. */
export function addMeal(plan: MealPlan, input: NewMeal, ctx: OpContext): MealPlan {
  const timestamp = ctx.now.toISOString();
  const { date, mealType, servings, ...content } = input;
  const meal = buildMeal(content, {
    id: ctx.newId(),
    date,
    mealType,
    servings,
    position: nextPosition(plan, date, mealType),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return withMeals(plan, [...plan.meals, meal]);
}

export function removeMeal(plan: MealPlan, id: string): MealPlan {
  if (!findMeal(plan, id)) return plan;
  return withMeals(plan, plan.meals.filter((meal) => meal.id !== id));
}

/**
 * Put a removed meal back where it was (for "Undo"). Meals now at or after
 * its old position in the slot move down one.
 */
export function restoreMeal(plan: MealPlan, meal: PlannedMeal): MealPlan {
  if (findMeal(plan, meal.id)) return plan;
  const shifted = plan.meals.map((other) =>
    slotKey(other) === slotKey(meal) && other.position >= meal.position
      ? { ...other, position: other.position + 1 }
      : other,
  );
  return withMeals(plan, [...shifted, meal]);
}

/** Swap what is planned, keeping the slot, position, and servings. */
export function replaceMeal(plan: MealPlan, id: string, content: MealContent, ctx: Pick<OpContext, "now">): MealPlan {
  const current = findMeal(plan, id);
  if (!current) return plan;
  const replacement = buildMeal(content, {
    id: current.id,
    date: current.date,
    mealType: current.mealType,
    position: current.position,
    servings: current.servings,
    createdAt: current.createdAt,
    updatedAt: ctx.now.toISOString(),
  });
  return withMeals(
    plan,
    plan.meals.map((meal) => (meal.id === id ? replacement : meal)),
  );
}

/** Copy a meal to the end of another (or the same) slot. */
export function duplicateMeal(
  plan: MealPlan,
  id: string,
  target: { date: string; mealType: MealType },
  ctx: OpContext,
): MealPlan {
  const source = findMeal(plan, id);
  if (!source) return plan;
  return addMeal(plan, { ...mealContent(source), ...target, servings: source.servings }, ctx);
}

/** Move a meal one place earlier or later within its slot. No-op at the edges. */
export function moveMeal(plan: MealPlan, id: string, direction: "up" | "down"): MealPlan {
  const meal = findMeal(plan, id);
  if (!meal) return plan;
  const targetPosition = meal.position + (direction === "up" ? -1 : 1);
  const neighbour = plan.meals.find((other) => slotKey(other) === slotKey(meal) && other.position === targetPosition);
  if (!neighbour) return plan;
  return withMeals(
    plan,
    plan.meals.map((other) => {
      if (other.id === meal.id) return { ...other, position: targetPosition };
      if (other.id === neighbour.id) return { ...other, position: meal.position };
      return other;
    }),
  );
}

export function setServings(plan: MealPlan, id: string, servings: number, ctx: Pick<OpContext, "now">): MealPlan {
  const meal = findMeal(plan, id);
  if (!meal || meal.servings === servings) return plan;
  return {
    ...plan,
    meals: plan.meals.map((other) =>
      other.id === id ? { ...other, servings, updatedAt: ctx.now.toISOString() } : other,
    ),
  };
}

/** Remove every meal on the given dates (a day, or a week). */
export function clearDates(plan: MealPlan, dates: readonly string[]): MealPlan {
  const set = new Set(dates);
  return withMeals(plan, plan.meals.filter((meal) => !set.has(meal.date)));
}

export function mealsOn(plan: MealPlan, date: string): PlannedMeal[] {
  return plan.meals.filter((meal) => meal.date === date).sort(compareMeals);
}

export function mealsInSlot(plan: MealPlan, date: string, mealType: MealType): PlannedMeal[] {
  return plan.meals.filter((meal) => meal.date === date && meal.mealType === mealType).sort(compareMeals);
}

export function countMealsOn(plan: MealPlan, dates: readonly string[]): number {
  const set = new Set(dates);
  return plan.meals.filter((meal) => set.has(meal.date)).length;
}
