# Dietitian review

**Status:** Pending. No registered dietitian has reviewed the app yet.

This pack lists everything a registered dietitian (or equivalent qualified nutrition professional) should check before public launch. When the review is done, record the reviewer and the outcome at the end, and change the status line to `**Status:** Approved` (or `Changes requested`). `npm run launch:check` reads that line.

The app is a meal-planning tool. It makes no medical claims, and it tells people with medical conditions, pregnancy or breastfeeding, or a history of disordered eating to get professional advice.

## 1. Target estimate (onboarding, "Estimate for me")

Code: `lib/nutrition/estimate.ts`. The working is shown to the user, who always reviews and edits the result. Profile details (age, sex, height, weight, activity) are used for the calculation only and are never saved.

| Step | Method |
|---|---|
| Resting energy | Mifflin–St Jeor (1990): 10 × kg + 6.25 × cm − 5 × age + s, where s = +5 (male), −161 (female), −78 (not specified; the midpoint) |
| Maintenance | Resting × activity factor: sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very active 1.9 |
| Goal adjustment | Lose fat −15%, build muscle +10%, eat more protein 0% |
| Calories | Rounded to 50 kcal, **never below 1,200 kcal** (a note suggests professional advice when this floor applies) |
| Protein | 1.8 g/kg (lose fat, build muscle) or 1.4 g/kg (eat more protein), rounded to 5 g, **capped at 35% of energy** |
| Who can use it | Adults only (18–100). Height 120–230 cm, weight 35–300 kg |

Questions for the reviewer:

- Are the −15% and +10% adjustments, and the 1,200 kcal floor, sensible defaults for a general adult audience?
- Are 1.4 and 1.8 g/kg reasonable starting points, and is a 35% energy cap appropriate?
- Should the "not specified" sex option use the midpoint constant?
- Is anyone missing from the "get professional advice" list?

## 2. Safety and targets copy

All user-facing text is in `lib/i18n/messages/en.ts`. `tests/unit/content/safety-copy.test.ts` blocks promises of results, moral food language, medical claims, and punitive wording. It also checks that these statements stay in place:

- "A meal-planning tool, not medical advice." (footer, every page)
- The targets disclaimer naming medical conditions, pregnancy or breastfeeding, and disordered eating (wherever targets are set)
- "Planning figures, not a judgement or medical assessment." (every progress panel)
- Going over a target is described neutrally ("150 kcal above target"), never in red or as a failure
- Allergen reminders: values are "based on typical versions of these ingredients … always check the labels"

Please read the onboarding flow, the Goals settings page, and the Today and Meal plan progress panels in the running app.

## 3. Recipe nutrition

Per-serving values are calculated from USDA FoodData Central values for each ingredient (`data/ingredients.ts`; full table with FDC IDs in `docs/nutrition-sources.md`). Limitations shown to users: raw ingredient weights, no cooking losses, carbohydrate includes fibre. Every value is labelled **Estimated**.

### Label thresholds (`lib/recipes/tags.ts`)

- **High protein:** at least 20% of energy from protein (the EU Regulation 1924/2006 condition for the claim)
- **Under 200 kcal:** snacks with 200 kcal or less per serving
- **Under 450 kcal:** meals with 450 kcal or less per serving
- **Quick:** 15 minutes or less in total
- Nothing is labelled "low calorie"

### The 25 recipes (per serving, as shown in the app)

| Recipe | Meal types | Servings | kcal | Protein g | Carbs g | Fat g | Energy from protein | Labels | Allergens |
|---|---|---|---|---|---|---|---|---|---|
| Berry yoghurt power bowl | breakfast | 1 | 345 | 30.6 | 45 | 5.9 | 35% | high_protein, under_450_kcal, quick, vegetarian | gluten, milk |
| Spinach and feta egg scramble | breakfast | 1 | 418 | 34.1 | 21.6 | 21.3 | 33% | high_protein, under_450_kcal, quick, vegetarian | gluten, eggs, milk |
| Blueberry protein overnight oats | breakfast | 3 | 493 | 44.7 | 61.1 | 8.9 | 36% | high_protein, quick, batch_friendly, vegetarian | gluten, milk |
| Cottage cheese oat pancakes | breakfast | 2 | 427 | 25.6 | 54.4 | 12.9 | 24% | high_protein, under_450_kcal, quick, vegetarian | gluten, eggs, milk |
| Smoked salmon and quark rye toast | breakfast, lunch | 1 | 337 | 27.5 | 41 | 7.5 | 33% | high_protein, under_450_kcal, quick | gluten, fish, milk |
| Turmeric tofu scramble | breakfast, lunch | 2 | 399 | 32.9 | 30.3 | 19.4 | 33% | high_protein, under_450_kcal, quick, vegan | gluten, soya |
| Lemon chicken quinoa bowl | lunch, dinner | 2 | 524 | 46.3 | 44.2 | 18.6 | 35% | high_protein, batch_friendly | milk |
| Tuna and chickpea salad | lunch | 2 | 425 | 41.4 | 42.2 | 11.3 | 39% | high_protein, under_450_kcal, quick, batch_friendly | fish |
| Smoky chicken and hummus wraps | lunch | 2 | 450 | 37.4 | 37.1 | 17 | 33% | high_protein, under_450_kcal | gluten, sesame |
| Red lentil and tomato soup | lunch, dinner | 4 | 331 | 18.2 | 56.6 | 5.6 | 22% | high_protein, under_450_kcal, batch_friendly, vegan | celery |
| Ginger tofu and edamame rice bowl | lunch, dinner | 2 | 529 | 32.8 | 62.8 | 19 | 25% | high_protein, batch_friendly, vegan | gluten, soya |
| Lemon salmon and potato traybake | dinner | 2 | 563 | 35.6 | 52.5 | 25.3 | 25% | high_protein | fish |
| Turkey and black bean chilli | dinner | 4 | 527 | 40.9 | 74.9 | 7.5 | 31% | high_protein, batch_friendly | none |
| Ginger chicken stir-fry | dinner | 2 | 535 | 44.1 | 67.5 | 9.8 | 33% | high_protein | gluten, soya |
| Lean beef and mushroom ragù | dinner | 4 | 601 | 45.5 | 75.8 | 15.2 | 30% | high_protein, batch_friendly | gluten, milk |
| Baked cod with pea and potato crush | dinner | 2 | 429 | 36.5 | 53.3 | 8.7 | 34% | high_protein, under_450_kcal | fish |
| Chickpea, tofu, and spinach curry | dinner | 4 | 628 | 29.5 | 89.1 | 19.5 | 19% | batch_friendly, vegan | soya |
| Garlic prawn and courgette pasta | dinner | 2 | 519 | 45.9 | 62.8 | 12.4 | 35% | high_protein | gluten, crustaceans, milk |
| Chocolate skyr pot | snack | 1 | 153 | 23.6 | 16.7 | 0.7 | 62% | high_protein, under_200_kcal, quick, vegetarian | milk |
| Cottage cheese and tomato rice cakes | snack | 1 | 161 | 12.4 | 21.8 | 2.9 | 31% | high_protein, under_200_kcal, quick, vegetarian | milk |
| Chilli and lemon edamame | snack | 1 | 141 | 14.2 | 11.8 | 5.7 | 40% | high_protein, under_200_kcal, quick, vegan | gluten, soya |
| Egg and veg snack box | snack | 1 | 262 | 16.4 | 16.5 | 15.1 | 25% | high_protein, quick, batch_friendly, vegetarian | eggs, sesame |
| Tuna and cucumber bites | snack | 1 | 202 | 35.9 | 9.5 | 2.3 | 71% | high_protein, quick | fish, milk |
| Peanut butter and banana quark | snack | 1 | 236 | 17.9 | 22.7 | 9.4 | 30% | high_protein, quick, vegetarian | milk, peanuts |
| Berry whey smoothie | snack, breakfast | 1 | 269 | 28.8 | 26.3 | 6.1 | 43% | high_protein, under_450_kcal, quick, vegetarian | milk |

Questions for the reviewer:

- Are any values implausible for the recipe as written?
- Are the portion sizes realistic for one serving?
- Are the allergens complete? They are derived from ingredients covering the 14 EU-declared allergens.
- Is it acceptable that "Chickpea, tofu, and spinach curry" (19% of energy from protein) appears in a high-protein app without the "High protein" label?

## Review record

| Date | Reviewer | Qualification and registration | Outcome | Changes requested |
|---|---|---|---|---|
| — | — | — | Not yet reviewed | — |
