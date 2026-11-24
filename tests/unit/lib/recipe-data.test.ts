import { describe, expect, it } from "vitest";
import { recipeData } from "@/data/recipes";
import { getIngredient, ingredients, requireIngredient } from "@/lib/ingredients/catalogue";
import { getRecipeDetails } from "@/lib/recipes/catalogue";
import { calculateNutritionPerServing, roundNutrition } from "@/lib/recipes/nutrition";
import { recipeSchema } from "@/lib/recipes/schema";

const recipes = recipeData.map((data) => recipeSchema.parse(data));
const details = getRecipeDetails();

describe("seed recipe data", () => {
  it("every recipe passes the schema", () => {
    for (const data of recipeData) {
      const result = recipeSchema.safeParse(data);
      expect(result.success, `${data.slug}: ${result.success ? "" : result.error.message}`).toBe(true);
    }
  });

  it("has unique slugs and ids", () => {
    expect(new Set(recipes.map((r) => r.slug)).size).toBe(recipes.length);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(recipes.length);
  });

  it("only uses curated ingredients, with the data each unit needs", () => {
    for (const recipe of recipes) {
      for (const line of recipe.ingredients) {
        const ingredient = getIngredient(line.ingredient);
        expect(ingredient, `${recipe.slug}: unknown ingredient ${line.ingredient}`).toBeDefined();
        if (line.unit === "piece") {
          expect(ingredient?.gramsPerPiece, `${recipe.slug}: ${line.ingredient} has no gramsPerPiece`).toBeDefined();
        }
      }
    }
  });

  it("stores nutrition that matches the ingredient calculation", () => {
    const mismatches = recipes
      .map((recipe) => ({
        slug: recipe.slug,
        stored: recipe.nutritionPerServing,
        calculated: roundNutrition(calculateNutritionPerServing(recipe.ingredients, recipe.servings, requireIngredient)),
      }))
      .filter(({ stored, calculated }) => JSON.stringify(stored) !== JSON.stringify(calculated));
    // On failure, copy the calculated values into data/recipes/index.ts.
    expect(mismatches).toEqual([]);
  });

  it("labels every value as estimated with a source, and has no unlicensed images", () => {
    for (const recipe of recipes) {
      expect(recipe.nutritionIsEstimated).toBe(true);
      expect(recipe.nutritionSource.length).toBeGreaterThan(20);
      if (recipe.image) {
        expect(recipe.image.licence).toBeTruthy();
        expect(recipe.image.attribution).toBeTruthy();
      }
    }
  });

  it("covers every meal type, snacks, diets, and cooking styles", () => {
    const count = (predicate: (d: (typeof details)[number]) => boolean) => details.filter(predicate).length;
    expect(count((d) => d.mealTypes.includes("breakfast"))).toBeGreaterThanOrEqual(4);
    expect(count((d) => d.mealTypes.includes("lunch"))).toBeGreaterThanOrEqual(4);
    expect(count((d) => d.mealTypes.includes("dinner"))).toBeGreaterThanOrEqual(5);
    expect(count((d) => d.mealTypes.includes("snack"))).toBeGreaterThanOrEqual(5);
    expect(count((d) => d.suitableFor.includes("vegetarian"))).toBeGreaterThanOrEqual(5);
    expect(count((d) => d.suitableFor.includes("vegan"))).toBeGreaterThanOrEqual(3);
    expect(count((d) => d.tags.includes("quick"))).toBeGreaterThanOrEqual(3);
    expect(count((d) => d.batchFriendly)).toBeGreaterThanOrEqual(3);
  });

  it("every snack is reasonably high in protein", () => {
    for (const d of details.filter((r) => r.mealTypes.includes("snack"))) {
      expect(d.nutritionPerServing.proteinG, d.slug).toBeGreaterThanOrEqual(10);
    }
  });
});

describe("ingredient catalogue", () => {
  it("has allergens and suitability data consistent with what recipes show", () => {
    const salmon = details.find((d) => d.slug === "lemon-salmon-traybake")!;
    expect(salmon.allergens).toContain("fish");
    expect(salmon.suitableFor).toEqual(["pescatarian"]);

    const curry = details.find((d) => d.slug === "chickpea-tofu-spinach-curry")!;
    expect(curry.suitableFor).toEqual(["vegan", "vegetarian", "pescatarian"]);
    expect(curry.allergens).toEqual(["soya"]);

    const bowl = details.find((d) => d.slug === "berry-yoghurt-power-bowl")!;
    // Honey is not vegan; yoghurt is dairy.
    expect(bowl.suitableFor).not.toContain("vegan");
    expect(bowl.allergens).toEqual(["gluten", "milk"]);
  });

  it("does not use nutrition values that are physically impossible", () => {
    for (const ingredient of ingredients) {
      if (!ingredient.per100g) continue;
      const { proteinG, carbsG, fatG } = ingredient.per100g;
      expect(proteinG + carbsG + fatG, ingredient.key).toBeLessThanOrEqual(100);
    }
  });
});
