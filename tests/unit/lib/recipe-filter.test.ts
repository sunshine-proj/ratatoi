import { describe, expect, it } from "vitest";
import { namesMatchTerm, normalizeText, resolveIngredientKey, singularize } from "@/lib/ingredients/catalogue";
import { defaultPreferences } from "@/lib/preferences/preferences";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";
import {
  countActiveFilters,
  emptyFilters,
  filterRecipes,
  hasPreferenceExclusions,
  matchesQuery,
  withPreferences,
} from "@/lib/recipes/filter";

function recipe(overrides: Partial<RecipeSummary> & { slug: string }): RecipeSummary {
  return {
    name: overrides.slug,
    description: "",
    mealTypes: ["lunch"],
    servings: 1,
    prepMinutes: 10,
    cookMinutes: 10,
    totalMinutes: 20,
    nutritionPerServing: { kcal: 400, proteinG: 30, carbsG: 40, fatG: 10 },
    nutritionIsEstimated: true,
    image: null,
    batchFriendly: false,
    allergens: [],
    suitableFor: ["vegan", "vegetarian", "pescatarian"],
    tags: [],
    ingredientNames: [],
    ...overrides,
    // Search uses the same names unless a test says otherwise.
    searchNames: overrides.searchNames ?? overrides.ingredientNames ?? [],
  };
}

const salmon = recipe({
  slug: "salmon-bowl",
  name: "Salmon rice bowl",
  mealTypes: ["dinner"],
  totalMinutes: 30,
  nutritionPerServing: { kcal: 550, proteinG: 35, carbsG: 50, fatG: 20 },
  allergens: ["fish", "soya"],
  suitableFor: ["pescatarian"],
  ingredientNames: [["Salmon fillet", "salmon"], ["Basmati rice (dried)", "rice"], ["Cherry tomatoes", "tomatoes"]],
});
const skyr = recipe({
  slug: "skyr-pot",
  name: "Chocolate skyr pot",
  mealTypes: ["snack"],
  totalMinutes: 3,
  nutritionPerServing: { kcal: 160, proteinG: 20, carbsG: 15, fatG: 1 },
  allergens: ["milk"],
  suitableFor: ["vegetarian", "pescatarian"],
  ingredientNames: [["Plain skyr", "skyr"], ["Honey"]],
});
const lentils = recipe({
  slug: "lentil-soup",
  name: "Red lentil soup",
  mealTypes: ["lunch", "dinner"],
  totalMinutes: 35,
  nutritionPerServing: { kcal: 336, proteinG: 19, carbsG: 54, fatG: 6 },
  allergens: ["celery"],
  ingredientNames: [["Red lentils (dried)", "lentils"], ["Mushrooms", "mushroom"], ["Chopped tomatoes (canned)"]],
});
const all = [salmon, skyr, lentils];
const slugs = (list: RecipeSummary[]) => list.map((r) => r.slug);

describe("text matching helpers", () => {
  it("normalises accents, case, and punctuation", () => {
    expect(normalizeText("  Crème-Fraîche! ")).toBe("creme fraiche");
  });

  it("singularises common plurals without mangling other words", () => {
    expect(["tomatoes", "berries", "leaves", "peas", "hummus", "oats", "radishes"].map(singularize)).toEqual([
      "tomato",
      "berry",
      "leaf",
      "pea",
      "hummus",
      "oat",
      "radish",
    ]);
  });

  it("matches exclusion terms as whole words, singular or plural", () => {
    expect(namesMatchTerm(["Cherry tomatoes"], "tomato")).toBe(true);
    expect(namesMatchTerm(["Chopped tomatoes (canned)"], "Tomatoes")).toBe(true);
    expect(namesMatchTerm(["Peanut butter"], "nut")).toBe(false);
    expect(namesMatchTerm(["Onions", "red onion"], "red onion")).toBe(true);
    expect(namesMatchTerm(["Spring onions"], "onion")).toBe(true);
    expect(namesMatchTerm(["Anything"], "  ")).toBe(false);
  });

  it("resolves aliases to canonical ingredients", () => {
    expect(resolveIngredientKey("Greek yogurt")).toBe("greek-yoghurt");
    expect(resolveIngredientKey("shrimp")).toBe("prawns");
    expect(resolveIngredientKey("Zucchini")).toBe("courgettes");
    expect(resolveIngredientKey("unicorn")).toBeUndefined();
  });
});

describe("filterRecipes", () => {
  it("returns everything with no filters, sorted by protein then name", () => {
    expect(slugs(filterRecipes(all, emptyFilters))).toEqual(["salmon-bowl", "skyr-pot", "lentil-soup"]);
  });

  it("searches by recipe name and ingredient, every word required", () => {
    const q = (query: string) => slugs(filterRecipes(all, { ...emptyFilters, query }, "name"));
    expect(q("salmon")).toEqual(["salmon-bowl"]);
    expect(q("tomatoes")).toEqual(["lentil-soup", "salmon-bowl"]);
    expect(q("tomato rice")).toEqual(["salmon-bowl"]);
    expect(q("SKYR")).toEqual(["skyr-pot"]);
    expect(q("lent")).toEqual(["lentil-soup"]);
    expect(q("  ")).toHaveLength(3);
    expect(matchesQuery(salmon, "beef")).toBe(false);
  });

  it("filters by meal type (multi-type recipes match each type)", () => {
    expect(slugs(filterRecipes(all, { ...emptyFilters, mealType: "dinner" }, "name"))).toEqual([
      "lentil-soup",
      "salmon-bowl",
    ]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, mealType: "breakfast" }))).toEqual([]);
  });

  it("uses inclusive protein, calorie, and time boundaries", () => {
    // "name" sort uses display names: Chocolate…, Red…, Salmon…
    expect(slugs(filterRecipes(all, { ...emptyFilters, proteinMinG: 20 }, "name"))).toEqual([
      "skyr-pot",
      "salmon-bowl",
    ]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, proteinMinG: 20.1 }))).toEqual(["salmon-bowl"]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, caloriesMaxKcal: 336 }, "name"))).toEqual([
      "skyr-pot",
      "lentil-soup",
    ]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, caloriesMaxKcal: 335 }))).toEqual(["skyr-pot"]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, totalTimeMaxMinutes: 30 }, "name"))).toEqual([
      "skyr-pot",
      "salmon-bowl",
    ]);
  });

  it("requires every selected dietary pattern", () => {
    expect(slugs(filterRecipes(all, { ...emptyFilters, dietaryPatterns: ["vegetarian"] }, "name"))).toEqual([
      "skyr-pot",
      "lentil-soup",
    ]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, dietaryPatterns: ["vegetarian", "vegan"] }))).toEqual([
      "lentil-soup",
    ]);
  });

  it("removes recipes containing excluded allergens or ingredients", () => {
    expect(slugs(filterRecipes(all, { ...emptyFilters, excludeAllergens: ["milk", "fish"] }))).toEqual([
      "lentil-soup",
    ]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, excludeIngredients: ["mushroom"] }, "name"))).toEqual([
      "skyr-pot",
      "salmon-bowl",
    ]);
    expect(slugs(filterRecipes(all, { ...emptyFilters, excludeIngredients: ["Tomato"] }))).toEqual(["skyr-pot"]);
  });

  it("combines filters (all must pass) and can return nothing", () => {
    const combined = { ...emptyFilters, mealType: "dinner" as const, proteinMinG: 15, excludeAllergens: ["fish" as const] };
    expect(slugs(filterRecipes(all, combined))).toEqual(["lentil-soup"]);
    expect(filterRecipes(all, { ...combined, caloriesMaxKcal: 100 })).toEqual([]);
  });

  it("sorts deterministically, breaking ties by name", () => {
    const twin = recipe({ ...skyr, slug: "a-twin", name: "A twin" });
    expect(slugs(filterRecipes([skyr, twin], emptyFilters, "protein"))).toEqual(["a-twin", "skyr-pot"]);
    expect(slugs(filterRecipes(all, emptyFilters, "calories"))).toEqual(["skyr-pot", "lentil-soup", "salmon-bowl"]);
    expect(slugs(filterRecipes(all, emptyFilters, "time"))).toEqual(["skyr-pot", "salmon-bowl", "lentil-soup"]);
    // Input order never changes the result.
    expect(filterRecipes([...all].reverse(), emptyFilters)).toEqual(filterRecipes(all, emptyFilters));
  });
});

describe("saved preferences", () => {
  const prefs = { ...defaultPreferences, dietaryPatterns: ["vegetarian" as const], excludedIngredients: ["mushrooms"] };

  it("adds preferences to filters without duplicating", () => {
    const merged = withPreferences({ ...emptyFilters, dietaryPatterns: ["vegetarian"] }, prefs);
    expect(merged.dietaryPatterns).toEqual(["vegetarian"]);
    expect(merged.excludeIngredients).toEqual(["mushrooms"]);
    expect(slugs(filterRecipes(all, merged))).toEqual(["skyr-pot"]);
    expect(withPreferences(emptyFilters, null)).toBe(emptyFilters);
  });

  it("knows when preferences exclude anything", () => {
    expect(hasPreferenceExclusions(defaultPreferences)).toBe(false);
    expect(hasPreferenceExclusions(prefs)).toBe(true);
    expect(hasPreferenceExclusions(null)).toBe(false);
  });

  it("counts active filters for the Filters button", () => {
    expect(countActiveFilters(emptyFilters)).toBe(0);
    expect(countActiveFilters({ ...emptyFilters, query: "x", proteinMinG: 0, excludeAllergens: ["milk", "eggs"] })).toBe(3);
  });
});

describe("real catalogue", () => {
  it("excluding milk removes every dairy recipe", () => {
    const results = filterRecipes(getRecipeSummaries("en"), { ...emptyFilters, excludeAllergens: ["milk"] });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.allergens).not.toContain("milk");
    expect(results.map((r) => r.slug)).not.toContain("chocolate-skyr-pot");
  });

  it("finds recipes by an ingredient alias", () => {
    const results = filterRecipes(getRecipeSummaries("en"), { ...emptyFilters, query: "shrimp" });
    expect(results.map((r) => r.slug)).toEqual(["garlic-prawn-courgette-pasta"]);
  });
});
