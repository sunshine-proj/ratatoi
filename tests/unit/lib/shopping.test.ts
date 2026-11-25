import { describe, expect, it } from "vitest";
import { getIngredient, getLocalizedIngredientName } from "@/lib/ingredients/catalogue";
import { getMessages } from "@/lib/i18n/catalogue";
import { addMeal, removeMeal, setServings, type NewMeal } from "@/lib/planner/operations";
import { emptyPlan, type MealPlan } from "@/lib/planner/schema";
import { getRecipeIngredientIndex } from "@/lib/recipes/catalogue";
import { generateItems, type RecipeIngredientIndex } from "@/lib/shopping/aggregate";
import { formatShoppingAmount, shoppingItemName } from "@/lib/shopping/format";
import { parseItemDraft } from "@/lib/shopping/item-form";
import {
  addManualItem,
  categoryFor,
  editItem,
  isUpToDate,
  regenerate,
  removeItem,
  restoreItem,
  setChecked,
  uncheckAll,
} from "@/lib/shopping/operations";
import { matchPreset, presetRange, validateRange } from "@/lib/shopping/range";
import { emptyShoppingList, shoppingListSchema, type ShoppingList } from "@/lib/shopping/schema";

const t = getMessages("en");
const WEEK = { start: "2026-11-23", end: "2026-11-29" };
const NOW = new Date("2026-11-24T12:00:00Z");

/** Small, hand-checkable recipes built from real catalogue ingredients. */
const index: RecipeIngredientIndex = {
  "chicken-bowl": {
    servings: 2,
    ingredients: [
      { ingredient: "chicken-breast", quantity: 300, unit: "g" },
      { ingredient: "olive-oil", quantity: 1, unit: "tbsp" },
      { ingredient: "lemon", quantity: 1, unit: "piece" },
      { ingredient: "ground-cumin", quantity: 1, unit: "tsp" },
    ],
  },
  "chicken-wrap": {
    servings: 1,
    ingredients: [
      { ingredient: "chicken-breast", quantity: 150, unit: "g" },
      { ingredient: "olive-oil", quantity: 1, unit: "tsp" },
      { ingredient: "ground-cumin", quantity: 0.5, unit: "tsp" },
    ],
  },
  "oily-salad": {
    servings: 1,
    ingredients: [
      { ingredient: "olive-oil", quantity: 20, unit: "ml" },
      { ingredient: "eggs", quantity: 2, unit: "piece" },
    ],
  },
  "egg-bake": {
    servings: 4,
    ingredients: [{ ingredient: "eggs", quantity: 200, unit: "g" }],
  },
};

let counter = 0;
const ctx = () => ({ now: NOW, newId: () => `m${++counter}` });
const meal = (recipeSlug: string, date = "2026-11-26", servings = 1, mealType: NewMeal["mealType"] = "lunch"): NewMeal => ({
  kind: "recipe",
  recipeSlug,
  date,
  mealType,
  servings,
});
function plan(...meals: NewMeal[]): MealPlan {
  counter = 0;
  const c = ctx();
  return meals.reduce((p, m) => addMeal(p, m, c), emptyPlan);
}
const generate = (p: MealPlan, recipes: RecipeIngredientIndex = index, range = WEEK) =>
  generateItems(p.meals, range, recipes, getIngredient);
const byId = <T extends { id: string }>(items: readonly T[]) =>
  Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, T>;

describe("generateItems", () => {
  it("returns nothing for an empty plan", () => {
    expect(generate(emptyPlan)).toEqual({ items: [], customMeals: 0, missingRecipes: 0, recipeMeals: 0 });
  });

  it("combines the same ingredient and unit across recipes, scaled by servings", () => {
    // chicken-bowl: 1 of 2 servings → 150 g; chicken-wrap: 1 of 1 → 150 g
    const items = byId(generate(plan(meal("chicken-bowl"), meal("chicken-wrap"))).items);
    expect(items["gen:chicken-breast:mass"]).toMatchObject({ quantity: 300, unit: "g", category: "meat_fish", name: "Chicken breast" });
    expect(items["gen:chicken-breast:mass"]?.sources.map((s) => s.recipeSlug)).toEqual(["chicken-bowl", "chicken-wrap"]);
  });

  it("combines spoons as teaspoons when every contribution is a spoon", () => {
    // ½ tbsp (= 1.5 tsp) + 1 tsp = 2.5 tsp oil; ½ tsp + ½ tsp = 1 tsp cumin
    const items = byId(generate(plan(meal("chicken-bowl"), meal("chicken-wrap"))).items);
    expect(items["gen:olive-oil:volume"]).toMatchObject({ quantity: 2.5, unit: "tsp" });
    expect(items["gen:ground-cumin:volume"]).toMatchObject({ quantity: 1, unit: "tsp" });
  });

  it("combines spoons with millilitres as ml (a spoon is a fixed volume)", () => {
    // 1 tsp (5 ml) + 20 ml = 25 ml
    const items = byId(generate(plan(meal("chicken-wrap"), meal("oily-salad"))).items);
    expect(items["gen:olive-oil:volume"]).toMatchObject({ quantity: 25, unit: "ml" });
  });

  it("keeps different unit families on separate lines (never mass ↔ count)", () => {
    // 2 eggs (pieces) and 50 g of egg (¼ of 200 g)
    const items = byId(generate(plan(meal("oily-salad"), meal("egg-bake"))).items);
    expect(items["gen:eggs:piece"]).toMatchObject({ quantity: 2, unit: "piece" });
    expect(items["gen:eggs:mass"]).toMatchObject({ quantity: 50, unit: "g" });
  });

  it("handles fractional servings", () => {
    const items = byId(generate(plan(meal("chicken-bowl", "2026-11-26", 0.5))).items);
    expect(items["gen:chicken-breast:mass"]?.quantity).toBe(75);
    expect(items["gen:lemon:piece"]?.quantity).toBe(0.25);
  });

  it("includes only meals inside the date range", () => {
    const p = plan(meal("chicken-wrap", "2026-11-22"), meal("chicken-wrap", "2026-11-23"), meal("chicken-wrap", "2026-11-30"));
    expect(byId(generate(p).items)["gen:chicken-breast:mass"]?.quantity).toBe(150);
  });

  it("counts custom meals and missing recipes instead of guessing", () => {
    counter = 0;
    let p = addMeal(emptyPlan, meal("chicken-wrap"), ctx());
    p = addMeal(p, meal("deleted-recipe"), ctx());
    p = addMeal(p, { kind: "custom", name: "Canteen", nutritionPerServing: { kcal: 500, proteinG: 30, carbsG: null, fatG: null }, date: "2026-11-26", mealType: "dinner", servings: 1 }, ctx());
    expect(generate(p)).toMatchObject({ customMeals: 1, missingRecipes: 1, recipeMeals: 1 });
  });

  it("is deterministic and sorted by aisle, then name", () => {
    const p = plan(meal("chicken-bowl"), meal("oily-salad", "2026-11-25"), meal("chicken-wrap", "2026-11-27"));
    const shuffled: MealPlan = { ...p, meals: [...p.meals].reverse() };
    expect(generate(shuffled)).toEqual(generate(p));
    expect(generate(p).items.map((item) => item.category)).toEqual([
      "fruit_veg",
      "meat_fish",
      "dairy_eggs",
      "pantry",
      "herbs_spices",
    ]);
  });

  it("works with the real catalogue: aliases are already canonical keys", () => {
    const p = plan(meal("lemon-salmon-traybake"), meal("garlic-prawn-courgette-pasta"));
    const items = byId(generate(p, getRecipeIngredientIndex()).items);
    // Both recipes use garlic cloves and lemons: one line each.
    expect(items["gen:garlic:piece"]?.quantity).toBeCloseTo(2 / 2 + 3 / 2, 10);
    expect(items["gen:lemon:piece"]?.quantity).toBeCloseTo(1 / 2 + 0.5 / 2, 10);
  });
});

describe("regenerate", () => {
  function listFor(p: MealPlan, previous: ShoppingList = emptyShoppingList) {
    return regenerate(previous, generate(p).items, WEEK, NOW);
  }

  it("produces a schema-valid list", () => {
    expect(shoppingListSchema.safeParse(listFor(plan(meal("chicken-bowl")))).success).toBe(true);
  });

  it("keeps ticks when the same item remains, even if the amount changes", () => {
    const p1 = plan(meal("chicken-bowl"));
    let list = setChecked(listFor(p1), "gen:chicken-breast:mass", true);
    const p2 = setServings(p1, p1.meals[0]!.id, 2, ctx()); // servings changed
    list = listFor(p2, list);
    expect(byId(list.items)["gen:chicken-breast:mass"]).toMatchObject({ quantity: 300, checked: true });
  });

  it("drops generated items the plan no longer needs (removed recipe)", () => {
    const p1 = plan(meal("chicken-bowl"), meal("oily-salad"));
    let list = setChecked(listFor(p1), "gen:eggs:piece", true);
    const p2 = removeMeal(p1, p1.meals.find((m) => m.kind === "recipe" && m.recipeSlug === "oily-salad")!.id);
    list = listFor(p2, list);
    expect(byId(list.items)["gen:eggs:piece"]).toBeUndefined();
    expect(byId(list.items)["gen:olive-oil:volume"]).toMatchObject({ quantity: 1.5, unit: "tsp" }); // back to spoons only
  });

  it("never touches manual items", () => {
    const p = plan(meal("chicken-bowl"));
    let list = addManualItem(listFor(p), { name: "Coffee", quantity: null, unit: null }, () => "x");
    list = setChecked(list, "manual:x", true);
    list = listFor(removeMeal(p, p.meals[0]!.id), list);
    expect(list.items).toEqual([expect.objectContaining({ id: "manual:x", name: "Coffee", checked: true, origin: "manual" })]);
  });

  it("keeps amounts the user edited and records what the plan needs now", () => {
    const p1 = plan(meal("chicken-bowl"));
    let list = editItem(listFor(p1), "gen:chicken-breast:mass", { quantity: 500, unit: "g", category: "meat_fish" });
    expect(byId(list.items)["gen:chicken-breast:mass"]).toMatchObject({ edited: true, quantity: 500, planQuantity: 150 });
    list = listFor(setServings(p1, p1.meals[0]!.id, 2, ctx()), list);
    expect(byId(list.items)["gen:chicken-breast:mass"]).toMatchObject({ edited: true, quantity: 500, planQuantity: 300 });
  });

  it("knows when the plan has changed since the list was made", () => {
    const p1 = plan(meal("chicken-bowl"));
    const list = setChecked(listFor(p1), "gen:lemon:piece", true);
    expect(isUpToDate(list, generate(p1).items)).toBe(true); // ticks don't matter
    expect(isUpToDate(list, generate(setServings(p1, p1.meals[0]!.id, 1.5, ctx())).items)).toBe(false);
  });
});

describe("list operations", () => {
  const base = regenerate(emptyShoppingList, generate(plan(meal("chicken-bowl"))).items, WEEK, NOW);

  it("ticks, unticks all, removes, and restores (undo)", () => {
    let list = setChecked(setChecked(base, "gen:lemon:piece", true), "gen:olive-oil:volume", true);
    expect(list.items.filter((i) => i.checked)).toHaveLength(2);
    list = uncheckAll(list);
    expect(list.items.some((i) => i.checked)).toBe(false);
    const lemon = list.items.find((i) => i.id === "gen:lemon:piece")!;
    const removed = removeItem(list, lemon.id);
    expect(removed.items.find((i) => i.id === lemon.id)).toBeUndefined();
    expect(restoreItem(removed, lemon)).toEqual(list);
  });

  it("adds manual items, sorting them into an aisle by name or alias", () => {
    const list = addManualItem(base, { name: "  Greek   yogurt ", quantity: 2, unit: "pack" }, () => "y");
    expect(list.items.find((i) => i.id === "manual:y")).toMatchObject({
      name: "Greek yogurt",
      canonicalKey: "greek-yoghurt",
      category: "dairy_eggs",
      quantity: 2,
      unit: "pack",
    });
    expect(categoryFor("Washing-up liquid")).toEqual({ canonicalKey: null, category: "other" });
  });

  it("drops a unit when no amount is given", () => {
    const list = addManualItem(base, { name: "Coffee", quantity: null, unit: "g" }, () => "c");
    expect(list.items.find((i) => i.id === "manual:c")).toMatchObject({ quantity: null, unit: null });
  });

  it("edits quantity, unit, and aisle; only manual items can be renamed", () => {
    let list = editItem(base, "gen:lemon:piece", { quantity: 2, unit: "piece", category: "fruit_veg", name: "Limes" });
    expect(list.items.find((i) => i.id === "gen:lemon:piece")).toMatchObject({ name: "Lemons", quantity: 2, edited: true });
    list = addManualItem(list, { name: "Coffee", quantity: null, unit: null }, () => "c");
    list = editItem(list, "manual:c", { quantity: 1, unit: "pack", category: "pantry", name: "Ground coffee" });
    expect(list.items.find((i) => i.id === "manual:c")).toMatchObject({ name: "Ground coffee", category: "pantry", edited: false });
  });

  it("never mutates its input", () => {
    const snapshot = JSON.stringify(base);
    setChecked(base, "gen:lemon:piece", true);
    removeItem(base, "gen:lemon:piece");
    editItem(base, "gen:lemon:piece", { quantity: 9, unit: "piece", category: "fruit_veg" });
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});

describe("formatting", () => {
  const amount = (quantity: number | null, unit: Parameters<typeof formatShoppingAmount>[0]["unit"], key?: string) =>
    formatShoppingAmount({ quantity, unit }, t, key ? getIngredient(key) : undefined);

  it("rounds for display and switches to kg and l for large amounts", () => {
    expect(amount(112.5, "g")).toBe("113 g");
    expect(amount(1250, "g")).toBe("1.25 kg");
    expect(amount(0.2, "g")).toBe("1 g");
    expect(amount(1500, "ml")).toBe("1.5 l");
    expect(amount(2.5, "tsp")).toBe("2½ tsp");
    expect(amount(0.1, "tsp")).toBe("¼ tsp"); // never shows a needed amount as zero
    expect(amount(2.5, "piece", "garlic")).toBe("2½ cloves");
    expect(amount(1, "piece", "garlic")).toBe("1 clove");
    expect(amount(0.75, "piece", "lemon")).toBe("¾");
    expect(amount(1, "pack")).toBe("1 pack");
    expect(amount(3, "pack")).toBe("3 packs");
    expect(amount(null, null)).toBe("");
  });

  it("uses singular names for one piece or less", () => {
    expect(shoppingItemName({ name: "Lemons", quantity: 0.75, unit: "piece", origin: "generated" }, getLocalizedIngredientName("lemon", "en"))).toBe("Lemon");
    expect(shoppingItemName({ name: "Lemons", quantity: 2, unit: "piece", origin: "generated" }, getLocalizedIngredientName("lemon", "en"))).toBe("Lemons");
  });
});

describe("date ranges", () => {
  it("offers this week, next week, and the next 7 days", () => {
    expect(presetRange("thisWeek", "2026-11-26")).toEqual({ start: "2026-11-23", end: "2026-11-29" });
    expect(presetRange("nextWeek", "2026-11-26")).toEqual({ start: "2026-11-30", end: "2026-12-06" });
    expect(presetRange("next7", "2026-11-26")).toEqual({ start: "2026-11-26", end: "2026-12-02" });
    expect(matchPreset({ start: "2026-11-30", end: "2026-12-06" }, "2026-11-26")).toBe("nextWeek");
    expect(matchPreset({ start: "2026-11-24", end: "2026-11-25" }, "2026-11-26")).toBe("custom");
  });

  it("validates custom ranges", () => {
    expect(validateRange({ start: "2026-11-26", end: "2026-11-26" })).toBeNull();
    expect(validateRange({ start: "2026-11-27", end: "2026-11-26" })).toEqual({ code: "invalid" });
    expect(validateRange({ start: "", end: "2026-11-26" })).toEqual({ code: "invalid" });
    // Inclusive: 1 Nov – 1 Dec is exactly 31 days (allowed); one more day is too long.
    expect(validateRange({ start: "2026-11-01", end: "2026-12-01" })).toBeNull();
    expect(validateRange({ start: "2026-11-01", end: "2026-12-02" })).toEqual({ code: "tooLong", max: 31 });
  });
});

describe("item form", () => {
  it("requires a name for manual items and allows a blank amount", () => {
    expect(parseItemDraft({ name: "", quantity: "", unit: "", category: "" }, { requireName: true })).toEqual({
      ok: false,
      errors: { name: { code: "required" } },
    });
    expect(parseItemDraft({ name: "Coffee", quantity: "", unit: "g", category: "" }, { requireName: true })).toEqual({
      ok: true,
      value: { name: "Coffee", quantity: null, unit: null, category: undefined },
    });
    expect(parseItemDraft({ name: "", quantity: "1,5", unit: "kg", category: "pantry" }, { requireName: false })).toEqual({
      ok: true,
      value: { name: "", quantity: 1.5, unit: "kg", category: "pantry" },
    });
    expect(parseItemDraft({ name: "x", quantity: "lots", unit: "", category: "" }, { requireName: true })).toMatchObject({
      ok: false,
      errors: { quantity: { code: "notANumber" } },
    });
  });
});
