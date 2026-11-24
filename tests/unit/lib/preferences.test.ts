import { describe, expect, it } from "vitest";
import {
  addExcludedIngredient,
  allergens,
  defaultPreferences,
  EXCLUDED_INGREDIENTS_MAX,
  normalizeIngredientName,
  toggleInList,
  userPreferencesSchema,
} from "@/lib/preferences/preferences";

describe("userPreferencesSchema", () => {
  it("accepts the defaults", () => {
    expect(userPreferencesSchema.safeParse(defaultPreferences).success).toBe(true);
  });

  it("lists all 14 EU-declared allergens", () => {
    expect(allergens).toHaveLength(14);
  });

  it("rejects unknown values, duplicates, and out-of-range meal counts", () => {
    const bad = [
      { ...defaultPreferences, allergens: ["chocolate"] },
      { ...defaultPreferences, allergens: ["milk", "milk"] },
      { ...defaultPreferences, snacksPerDay: 9 },
      { ...defaultPreferences, mainMealsPerDay: 0 },
      { ...defaultPreferences, excludedIngredients: [""] },
    ];
    for (const value of bad) expect(userPreferencesSchema.safeParse(value).success).toBe(false);
  });
});

describe("excluded ingredients", () => {
  it("normalises names", () => {
    expect(normalizeIngredientName("  Red   Onion ")).toBe("red onion");
  });

  it("adds, and refuses empties and duplicates (case-insensitive)", () => {
    const first = addExcludedIngredient([], "Mushrooms");
    expect(first).toEqual({ status: "added", list: ["mushrooms"] });
    expect(addExcludedIngredient(first.list, " MUSHROOMS ").status).toBe("duplicate");
    expect(addExcludedIngredient(first.list, "   ").status).toBe("empty");
  });

  it("refuses overly long names and full lists", () => {
    expect(addExcludedIngredient([], "x".repeat(61)).status).toBe("tooLong");
    const full = Array.from({ length: EXCLUDED_INGREDIENTS_MAX }, (_, i) => `item ${i}`);
    expect(addExcludedIngredient(full, "one more").status).toBe("full");
  });
});

describe("toggleInList", () => {
  it("keeps canonical order regardless of click order", () => {
    let selected = toggleInList(allergens, [], "sesame", true);
    selected = toggleInList(allergens, selected, "celery", true);
    expect(selected).toEqual(["celery", "sesame"]);
    expect(toggleInList(allergens, selected, "sesame", false)).toEqual(["celery"]);
  });
});
