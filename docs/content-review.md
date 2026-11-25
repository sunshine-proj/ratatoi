# Content and safety review

**Date:** 2026-11-24 (Phase 8). **Scope:** all UI text (`lib/i18n/messages/en.ts`), the 25 seed recipes (`data/recipes/index.ts`), and the ingredient table (`data/ingredients.ts`).

## Recipes and nutrition

| Check | Result | How it's enforced |
|---|---|---|
| Recipe text is original or licensed | ✅ All 25 are original recipes written for Protein Plate, credited as such on each recipe page. | `contentSource` is required by the schema. |
| Every recipe has nutrition per serving with a source and an estimated/verified flag | ✅ All are marked **Estimated**, with the source shown on the page. | Schema plus `tests/unit/lib/recipe-data.test.ts`. |
| Stored nutrition matches the ingredient calculation | ✅ | Same test fails on any drift. |
| Allergens are shown and not over-promised | ✅ Derived from ingredients (14 EU allergens), with "always check labels" on every recipe. | `lib/recipes/catalogue.ts`; copy test. |
| Labels have stated thresholds | ✅ "High protein" (≥ 20% energy, the EU claim condition), "Under 200/450 kcal", "Quick" (≤ 15 min). Nothing is called "low calorie". | `lib/recipes/tags.ts`; rules shown on each recipe page. |
| Images are licensed | ✅ No photos: every recipe shows a designed illustration owned by the project, and says so. Launching without photos is decision 0003. The schema requires alt text, attribution, and licence for any photo added later. | Schema; data test. |
| Nutrition values from an authoritative database | ✅ Every ingredient with nutrition cites USDA FoodData Central (SR Legacy; Branded label data for skyr, quark, and light coconut milk). Recipe values were recalculated from them. Full table: `docs/nutrition-sources.md`. | The schema requires a source; `tests/unit/lib/recipe-data.test.ts`. |

## Translations

The Latvian, Lithuanian, and Estonian interface text and recipes were drafted by an AI assistant and are **pending native-speaker review** (`docs/translations.md`). Every language has every key, placeholder, recipe step, and note (`tests/unit/i18n/`). The safety-copy test below checks only the English wording; the reviewers check the rest.

## Safety copy

Reviewed by reading all user-facing text, then encoded as `tests/unit/content/safety-copy.test.ts`, which fails on:

- promises of results ("guarantee", "lose 5 kg", "weight-loss", "rapid", "detox", "fat-burning");
- moral or shaming food language ("cheat", "guilt", "sinful", "junk", "good/bad food", "skinny", "starve");
- medical claims ("cure", "disease", "prescribe");
- restrictive or punitive wording ("over budget", "exceed", "too much", "forbidden", "must eat").

Two careful negations are explicitly allowed: "not a prescription" (estimate note) and "we can't guarantee a recipe is free from an allergen".

The test also checks that the key safety statements stay in place:

- "A meal-planning tool, not medical advice" (footer, every page).
- The targets disclaimer naming medical conditions, pregnancy or breastfeeding, and disordered eating (shown wherever targets are set).
- "Planning figures, not a judgement or medical assessment" (every progress panel).
- A neutral note suggesting professional advice below 1,200 kcal; estimates never go below 1,200 kcal.
- Label-checking reminders for allergens.

Progress above target is described neutrally ("150 kcal above target"), never in red.

## Recommended before launch

- Have a registered dietitian review the recipes, targets copy, and estimate method: pack in `docs/dietitian-review.md`.
- After launch: licensed photography (decision 0003).
