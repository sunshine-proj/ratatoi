import { describe, expect, it } from "vitest";
import { getMessages } from "@/lib/i18n/catalogue";
import { formatPlural } from "@/lib/i18n/format";
import type { RecipeIngredientLine } from "@/lib/recipes/catalogue";
import { deriveSuitability } from "@/lib/recipes/catalogue";
import { formatAmount, formatQuantity } from "@/lib/recipes/format";
import { calculateNutritionPerServing, ingredientGrams } from "@/lib/recipes/nutrition";
import { deriveTags, proteinEnergyShare } from "@/lib/recipes/tags";
import { requireIngredient } from "@/lib/ingredients/catalogue";

const base = {
  nutritionPerServing: { kcal: 400, proteinG: 20, carbsG: 40, fatG: 10 },
  mealTypes: ["lunch" as const],
  totalMinutes: 30,
  batchFriendly: false,
  suitableFor: [] as ("vegan" | "vegetarian" | "pescatarian")[],
};

describe("deriveTags", () => {
  it("calls a recipe high protein at exactly 20% of energy, not below", () => {
    expect(proteinEnergyShare({ kcal: 400, proteinG: 20 })).toBe(0.2);
    expect(deriveTags(base)).toContain("high_protein");
    expect(deriveTags({ ...base, nutritionPerServing: { ...base.nutritionPerServing, proteinG: 19.9 } })).not.toContain(
      "high_protein",
    );
  });

  it("uses stated calorie thresholds for snacks and meals", () => {
    const snack = { ...base, mealTypes: ["snack" as const] };
    expect(deriveTags({ ...snack, nutritionPerServing: { ...base.nutritionPerServing, kcal: 200 } })).toContain("under_200_kcal");
    expect(deriveTags({ ...snack, nutritionPerServing: { ...base.nutritionPerServing, kcal: 201 } })).not.toContain("under_200_kcal");
    expect(deriveTags({ ...base, nutritionPerServing: { ...base.nutritionPerServing, kcal: 450 } })).toContain("under_450_kcal");
    expect(deriveTags({ ...base, nutritionPerServing: { ...base.nutritionPerServing, kcal: 451 } })).not.toContain("under_450_kcal");
  });

  it("labels quick, batch, and diet", () => {
    expect(deriveTags({ ...base, totalMinutes: 15 })).toContain("quick");
    expect(deriveTags({ ...base, totalMinutes: 16 })).not.toContain("quick");
    expect(deriveTags({ ...base, batchFriendly: true })).toContain("batch_friendly");
    expect(deriveTags({ ...base, suitableFor: ["vegan", "vegetarian", "pescatarian"] })).toContain("vegan");
    expect(deriveTags({ ...base, suitableFor: ["vegetarian", "pescatarian"] })).toEqual(
      expect.arrayContaining(["vegetarian"]),
    );
  });
});

describe("deriveSuitability", () => {
  it("derives diets from ingredient kinds", () => {
    expect(deriveSuitability(["plant", "plant"])).toEqual(["vegan", "vegetarian", "pescatarian"]);
    expect(deriveSuitability(["plant", "dairy", "honey"])).toEqual(["vegetarian", "pescatarian"]);
    expect(deriveSuitability(["plant", "shellfish"])).toEqual(["pescatarian"]);
    expect(deriveSuitability(["meat", "plant"])).toEqual([]);
  });
});

describe("nutrition calculation", () => {
  it("converts pieces, spoons, and millilitres to grams", () => {
    const eggs = requireIngredient("eggs");
    expect(ingredientGrams({ ingredient: "eggs", quantity: 2, unit: "piece" }, eggs)).toBe(100);
    const oil = requireIngredient("olive-oil");
    expect(ingredientGrams({ ingredient: "olive-oil", quantity: 1, unit: "tbsp" }, oil)).toBeCloseTo(13.8, 5);
    expect(ingredientGrams({ ingredient: "olive-oil", quantity: 1, unit: "tsp" }, oil)).toBeCloseTo(4.6, 5);
  });

  it("divides by servings and ignores negligible ingredients", () => {
    const result = calculateNutritionPerServing(
      [
        { ingredient: "chicken-breast", quantity: 200, unit: "g" },
        { ingredient: "ground-cumin", quantity: 2, unit: "tsp" },
      ],
      2,
      requireIngredient,
    );
    expect(result).toEqual({ kcal: 120, proteinG: 22.5, carbsG: 0, fatG: 2.6 });
  });
});

describe("formatting", () => {
  const t = getMessages("en");
  const line = (overrides: Partial<RecipeIngredientLine>): RecipeIngredientLine => ({
    ingredient: "x",
    quantity: 1,
    unit: "g",
    name: "X",
    category: "pantry",
    ...overrides,
  });

  it("formats quantities with friendly fractions", () => {
    expect(formatQuantity(0.5, "en")).toBe("½");
    expect(formatQuantity(1.5, "en")).toBe("1½");
    expect(formatQuantity(0.25, "en")).toBe("¼");
    expect(formatQuantity(240, "en")).toBe("240");
    expect(formatQuantity(2.3, "en")).toBe("2.3");
  });

  it("formats amounts with metric units and counting words", () => {
    expect(formatAmount(line({ quantity: 120, unit: "g" }), t)).toBe("120 g");
    expect(formatAmount(line({ quantity: 0.5, unit: "tsp" }), t)).toBe("½ tsp");
    expect(formatAmount(line({ quantity: 2, unit: "piece", pieceName: { one: "slice", other: "slices" } }), t)).toBe(
      "2 slices",
    );
    expect(formatAmount(line({ quantity: 1, unit: "piece", pieceName: { one: "clove", other: "cloves" } }), t)).toBe(
      "1 clove",
    );
    expect(formatAmount(line({ quantity: 2, unit: "piece" }), t)).toBe("2");
  });

  it("pluralises messages", () => {
    expect(formatPlural(t.recipes.resultCount, 1, "en")).toBe("1 recipe");
    expect(formatPlural(t.recipes.resultCount, 0, "en")).toBe("0 recipes");
    expect(formatPlural(t.recipes.resultCount, 1200, "en")).toBe("1,200 recipes");
  });
});

describe("ingredient display names", () => {
  it("uses the singular name for one piece or less", async () => {
    const { getRecipeDetail } = await import("@/lib/recipes/catalogue");
    const salmon = getRecipeDetail("lemon-salmon-traybake", "en")!;
    expect(salmon.ingredients.find((line) => line.ingredient === "lemon")?.name).toBe("Lemon");
    const chilli = getRecipeDetail("turkey-black-bean-chilli", "en")!;
    expect(chilli.ingredients.find((line) => line.ingredient === "red-pepper")?.name).toBe("Red peppers");
    expect(chilli.ingredients.find((line) => line.ingredient === "onion")?.name).toBe("Onion");
  });
});
