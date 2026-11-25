import { describe, expect, it } from "vitest";
import { recipeData } from "@/data/recipes";
import { parseNumberField, numberToInput } from "@/lib/forms/number-field";
import { getLocalizedIngredientName, ingredients, resolveIngredientKey } from "@/lib/ingredients/catalogue";
import { ingredientTranslations } from "@/lib/ingredients/translations";
import { getMessages } from "@/lib/i18n/catalogue";
import { getRecipeDetail, getRecipeSummaries } from "@/lib/recipes/catalogue";
import { emptyFilters, filterRecipes } from "@/lib/recipes/filter";
import { formatAmount } from "@/lib/recipes/format";
import { recipeTranslations } from "@/lib/recipes/translations";
import { formatShoppingAmount, shoppingItemName } from "@/lib/shopping/format";

const translated = ["lv", "lt", "et"] as const;

describe.each(translated)("%s content translation", (locale) => {
  const ingredientText = ingredientTranslations[locale];
  const recipeText = recipeTranslations[locale];

  it("names every ingredient, and nothing else", () => {
    expect(Object.keys(ingredientText.ingredients).sort()).toEqual(ingredients.map((i) => i.key).sort());
    for (const [key, text] of Object.entries(ingredientText.ingredients)) {
      expect(text.name.trim(), key).not.toBe("");
      for (const alias of text.aliases ?? []) expect(alias.trim(), key).not.toBe("");
    }
  });

  it("gives a counting word wherever English has one", () => {
    for (const ingredient of ingredients.filter((i) => i.pieceName)) {
      expect(ingredientText.ingredients[ingredient.key]?.pieceName, ingredient.key).toBeDefined();
    }
  });

  it("translates every recipe: name, description, each step, each note, and storage", () => {
    expect(Object.keys(recipeText.recipes).sort()).toEqual(recipeData.map((r) => r.slug).sort());
    for (const recipe of recipeData) {
      const text = recipeText.recipes[recipe.slug]!;
      expect(text.name.trim(), recipe.slug).not.toBe("");
      expect(text.description.trim(), recipe.slug).not.toBe("");
      expect(text.steps.length, `${recipe.slug} steps`).toBe(recipe.steps.length);
      const noted = recipe.ingredients.filter((line) => line.note).map((line) => line.ingredient).sort();
      expect(Object.keys(text.notes ?? {}).sort(), `${recipe.slug} notes`).toEqual(noted);
      expect(text.storageNote === undefined, `${recipe.slug} storage note`).toBe(recipe.storageNote === undefined);
    }
  });

  it("shows translated recipes with the same numbers as English", () => {
    for (const recipe of getRecipeSummaries(locale)) {
      const english = getRecipeDetail(recipe.slug, "en")!;
      expect(recipe.name).not.toBe(english.name);
      expect(recipe.nutritionPerServing).toEqual(english.nutritionPerServing);
      expect(recipe.allergens).toEqual(english.allergens);
      expect(recipe.tags).toEqual(english.tags);
    }
    const detail = getRecipeDetail("lemon-salmon-traybake", locale)!;
    expect(detail.nutritionSource).toBe(recipeText.nutritionSource);
    expect(detail.contentSource).toEqual(recipeText.contentSource);
    expect(detail.ingredients.find((line) => line.ingredient === "salmon")?.name).toBe(ingredientText.ingredients.salmon!.name);
  });
});

describe("localised content in use", () => {
  it("counts pieces with the right Lithuanian form", () => {
    const t = getMessages("lt");
    const garlic = getRecipeDetail("turkey-black-bean-chilli", "lt")!.ingredients.find((line) => line.ingredient === "garlic")!;
    expect(formatAmount({ ...garlic, quantity: 1 }, t)).toBe("1 skiltelė");
    expect(formatAmount({ ...garlic, quantity: 3 }, t)).toBe("3 skiltelės");
    expect(formatAmount({ ...garlic, quantity: 12 }, t)).toBe("12 skiltelių");
    const eggs = getRecipeDetail("spinach-feta-egg-scramble", "lt")!.ingredients.find((line) => line.ingredient === "eggs")!;
    expect(formatAmount(eggs, t)).toBe("2 vnt.");
    expect(eggs.name).toBe("Kiaušiniai");
  });

  it("finds recipes by ingredient in each language", () => {
    const search = (locale: "lt" | "lv" | "et", query: string) =>
      filterRecipes(getRecipeSummaries(locale), { ...emptyFilters, query }).map((r) => r.slug);
    expect(search("lt", "lašiša")).toContain("lemon-salmon-traybake");
    expect(search("lt", "lasisa")).toContain("lemon-salmon-traybake"); // without diacritics
    expect(search("lv", "lasis")).toContain("lemon-salmon-traybake");
    expect(search("et", "lõhe")).toContain("lemon-salmon-traybake");
    // English words still work in every language.
    expect(search("et", "salmon")).toContain("lemon-salmon-traybake");
  });

  it("applies saved exclusions whatever language they were typed in", () => {
    const withoutMushrooms = (locale: "en" | "lt", term: string) =>
      filterRecipes(getRecipeSummaries(locale), { ...emptyFilters, excludeIngredients: [term] }).map((r) => r.slug);
    expect(withoutMushrooms("en", "grybai")).not.toContain("lean-beef-ragu-wholewheat-pasta");
    expect(withoutMushrooms("lt", "mushrooms")).not.toContain("lean-beef-ragu-wholewheat-pasta");
    expect(withoutMushrooms("lt", "grybai")).toHaveLength(getRecipeSummaries("lt").length - 1);
  });

  it("sorts recipe names by each language's alphabet", () => {
    const names = filterRecipes(getRecipeSummaries("et"), emptyFilters, "name", "et").map((r) => r.name);
    expect(names).toEqual([...names].sort(new Intl.Collator("et-EE").compare));
  });

  it("matches your own list items to ingredients in any language", () => {
    expect(resolveIngredientKey("Vištiena")).toBe("chicken-breast");
    expect(resolveIngredientKey("kohupiim")).toBe("quark");
    expect(resolveIngredientKey("biezpiens")).toBe("quark");
  });

  it("names generated shopping lines in the current language, but keeps what you typed", () => {
    const t = getMessages("lv");
    const lemon = getLocalizedIngredientName("lemon", "lv");
    expect(shoppingItemName({ name: "Lemons", quantity: 2, unit: "piece", origin: "generated" }, lemon)).toBe("Citroni");
    expect(shoppingItemName({ name: "Lemons please", quantity: 2, unit: "piece", origin: "manual" }, lemon)).toBe("Lemons please");
    expect(formatShoppingAmount({ quantity: 2, unit: "piece" }, t, lemon)).toBe("2 gab.");
    expect(formatShoppingAmount({ quantity: 1250, unit: "g" }, t, lemon)).toBe("1,25 kg");
  });
});

describe("numbers typed in each language", () => {
  it("reads a comma as the decimal separator outside English", () => {
    const opts = { min: 0, max: 100_000 };
    expect(parseNumberField("1,250", { ...opts, locale: "en" })).toEqual({ ok: true, value: 1250 });
    expect(parseNumberField("1,250", { ...opts, locale: "lt" })).toEqual({ ok: true, value: 1.25 });
    expect(parseNumberField("72,5", { ...opts, locale: "et" })).toEqual({ ok: true, value: 72.5 });
    expect(parseNumberField("1 900", { ...opts, locale: "lv" })).toEqual({ ok: true, value: 1900 });
    expect(parseNumberField("2.5", { ...opts, locale: "lt" })).toEqual({ ok: true, value: 2.5 });
  });

  it("writes stored decimals back with the locale's separator", () => {
    expect(numberToInput(1.25, "lt")).toBe("1,25");
    expect(numberToInput(1.25, "en")).toBe("1.25");
    expect(numberToInput(null, "lt")).toBe("");
  });
});
