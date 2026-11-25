import { describe, expect, it } from "vitest";
import { recipeData } from "@/data/recipes";
import { getMessages } from "@/lib/i18n/catalogue";

/**
 * Safety copy review, made repeatable (see docs/content-review.md).
 * Fails if user-facing text promises results, moralises food, or encourages
 * restriction. Two careful negations are explicitly allowed.
 */
const RISKY = [
  /guarantee/i,
  /\blose \d+/i,
  /weight[- ]loss/i,
  /\brapid/i,
  /detox|cleanse/i,
  /fat[- ]?burn|burn fat/i,
  /\bcheat/i,
  /guilt|sinful|naughty|shame/i,
  /clean eating|junk food|bad food|good food/i,
  /skinny|slim(ming)?\b/i,
  /starv/i,
  /\bcure|\bdisease/i,
  /prescri/i,
  /diet pill/i,
  /over budget|exceed|too much|forbidden|must eat/i,
];

/** Negations that say the opposite of the risky claim. */
const ALLOWED = [
  "A rough estimate to start from, not a prescription.",
  "we can't guarantee a recipe is free from an allergen",
];

function strings(value: unknown, path = ""): Array<[string, string]> {
  if (typeof value === "string") return [[path, value]];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => strings(child, path ? `${path}.${key}` : key));
  }
  return [];
}

const t = getMessages("en");
const recipeText = recipeData.flatMap((recipe) =>
  [recipe.name, recipe.description, recipe.storageNote ?? "", ...recipe.steps].map((text) => [recipe.slug, text] as [string, string]),
);

describe("safety copy", () => {
  it("has no risky claims or moral food language in UI text or recipes", () => {
    const hits: string[] = [];
    for (const [where, text] of [...strings(t), ...recipeText]) {
      const cleaned = ALLOWED.reduce((acc, phrase) => acc.replace(phrase, ""), text);
      for (const pattern of RISKY) if (pattern.test(cleaned)) hits.push(`${where}: "${text}" (${pattern})`);
    }
    expect(hits).toEqual([]);
  });

  it("keeps the key safety statements", () => {
    expect(t.app.disclaimer).toMatch(/not medical advice/);
    expect(t.disclaimer.body).toMatch(/not medical advice/);
    expect(t.disclaimer.body).toMatch(/pregnant|disordered eating|medical condition/);
    expect(t.progress.note).toMatch(/not a judgement or medical assessment/);
    expect(t.targets.lowCalorieNotice).toMatch(/doctor or registered dietitian/);
    expect(t.preferences.allergens.hint).toMatch(/check product labels/);
    expect(t.recipes.detail.allergenCaveat).toMatch(/check the labels/);
    expect(t.privacy.advice).toMatch(/not medical advice/);
  });

  it("describes targets above plan neutrally", () => {
    expect(t.progress.above).toBe("{value} {unit} above target");
  });
});
