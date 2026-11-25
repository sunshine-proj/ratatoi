# Nutrition sources

Every ingredient's nutrition values (per 100 g) come from **USDA FoodData Central** (public domain), retrieved 2026-11-24.

- **SR Legacy**: USDA Standard Reference food-composition data, release 2018-04.
- **Branded**: manufacturers' declared label values held in FoodData Central; used only where no generic entry exists.

Recipes calculate per-serving values from these, using raw ingredient weights; cooking losses aren't modelled, so recipe values are shown as **Estimated**.
Carbohydrate is USDA's "carbohydrate by difference", which includes fibre (EU labels exclude it).
Spices, fresh herbs, and baking powder are used in negligible amounts and aren't counted.

To check a value: `https://fdc.nal.usda.gov/food-details/<FDC ID>/nutrients`. The source is also recorded on each ingredient in `data/ingredients.ts`, and the schema requires one.

| Ingredient key | Dataset | FDC ID(s) | FoodData Central description | kcal | Protein g | Carbs g | Fat g | Note |
|---|---|---|---|---|---|---|---|---|
| `banana` | SR Legacy | 173944 | Bananas, raw | 89 | 1.1 | 22.8 | 0.3 |  |
| `basmati-rice` | SR Legacy | 168877 | Rice, white, long-grain, regular, raw, enriched | 365 | 7.1 | 80.0 | 0.7 | White long-grain rice, raw. |
| `black-beans` | SR Legacy | 173735 | Beans, black, mature seeds, cooked, boiled, without salt | 132 | 8.9 | 23.7 | 0.5 | Cooked black beans, as the closest match to canned beans drained. |
| `blueberries` | SR Legacy | 171711 | Blueberries, raw | 57 | 0.7 | 14.5 | 0.3 |  |
| `broccoli` | SR Legacy | 170379 | Broccoli, raw | 34 | 2.8 | 6.6 | 0.4 |  |
| `brown-rice` | SR Legacy | 169703 | Rice, brown, long-grain, raw (Includes foods for USDA's Food Distribution Program) | 367 | 7.5 | 76.2 | 3.2 |  |
| `canned-tomatoes` | SR Legacy | 170051 | Tomatoes, red, ripe, canned, packed in tomato juice | 16 | 0.8 | 3.5 | 0.2 | Canned in tomato juice. |
| `carrots` | SR Legacy | 170393 | Carrots, raw | 41 | 0.9 | 9.6 | 0.2 |  |
| `cherry-tomatoes` | SR Legacy | 170457 | Tomatoes, red, ripe, raw, year round average | 18 | 0.9 | 3.9 | 0.2 | Red ripe tomatoes, year-round average. |
| `chia-seeds` | SR Legacy | 170554 | Seeds, chia seeds, dried | 486 | 16.5 | 42.1 | 30.7 |  |
| `chicken-breast` | SR Legacy | 171077 | Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw | 120 | 22.5 | 0.0 | 2.6 |  |
| `chickpeas` | SR Legacy | 173801 | Chickpeas (garbanzo beans, bengal gram), mature seeds, canned, drained, rinsed in tap water | 138 | 7.0 | 22.9 | 2.5 | Canned, drained and rinsed. |
| `cocoa-powder` | SR Legacy | 169593 | Cocoa, dry powder, unsweetened | 228 | 19.6 | 57.9 | 13.7 |  |
| `cod` | SR Legacy | 171955 | Fish, cod, Atlantic, raw | 82 | 17.8 | 0.0 | 0.7 |  |
| `cottage-cheese` | SR Legacy | 172182 | Cheese, cottage, lowfat, 2% milkfat | 81 | 10.4 | 4.8 | 2.3 | 2% milkfat cottage cheese. |
| `courgettes` | SR Legacy | 169291 | Squash, summer, zucchini, includes skin, raw | 17 | 1.2 | 3.1 | 0.3 | Zucchini, including skin. |
| `cucumber` | SR Legacy | 168409 | Cucumber, with peel, raw | 15 | 0.7 | 3.6 | 0.1 | With peel. |
| `edamame` | SR Legacy | 168410 | Edamame, frozen, unprepared | 109 | 11.2 | 7.6 | 4.7 |  |
| `egg-whites` | SR Legacy | 172183 | Egg, white, raw, fresh | 52 | 10.9 | 0.7 | 0.2 |  |
| `eggs` | SR Legacy | 171287 | Egg, whole, raw, fresh | 143 | 12.6 | 0.7 | 9.5 |  |
| `feta` | SR Legacy | 173420 | Cheese, feta | 265 | 14.2 | 3.9 | 21.5 |  |
| `garlic` | SR Legacy | 169230 | Garlic, raw | 149 | 6.4 | 33.1 | 0.5 |  |
| `ginger` | SR Legacy | 169231 | Ginger root, raw | 80 | 1.8 | 17.8 | 0.8 |  |
| `greek-yoghurt` | SR Legacy | 170894 | Yogurt, Greek, plain, nonfat (Includes foods for USDA's Food Distribution Program) | 59 | 10.2 | 3.6 | 0.4 |  |
| `honey` | SR Legacy | 169640 | Honey | 304 | 0.3 | 82.4 | 0.0 |  |
| `hummus` | SR Legacy | 174289 | Hummus, commercial | 237 | 7.8 | 15.0 | 17.8 | Commercial hummus. |
| `lean-beef-mince` | SR Legacy | 171790 | Beef, ground, 95% lean meat / 5% fat, raw | 137 | 21.4 | 0.0 | 5.0 |  |
| `lemon` | SR Legacy | 167746 | Lemons, raw, without peel | 29 | 1.1 | 9.3 | 0.3 | Without peel. |
| `light-coconut-milk` | Branded | 2432016 | LIGHT COCONUT MILK (RV Industries Inc.) | 57 | 1.3 | 1.3 | 5.7 | Manufacturer label values for light coconut milk; brands vary. |
| `milk` | SR Legacy | 171267 | Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D | 50 | 3.3 | 4.8 | 2.0 | 2% milkfat, the closest match to EU semi-skimmed milk (1.5–1.8% fat). |
| `mixed-berries` | SR Legacy | 168173, 168209, 173950, 171710 | Strawberries, frozen, unsweetened (Includes foods for USDA's Food Distribution Program); Raspberries, frozen, red, unsweetened; Blueberries, frozen, unsweetened (Includes foods for USDA's Food Distribution Program); Blackberries, frozen, unsweetened | 52 | 0.8 | 12.4 | 0.5 | Average of frozen unsweetened strawberries, raspberries, blueberries, and blackberries. |
| `mushrooms` | SR Legacy | 169251 | Mushrooms, white, raw | 22 | 3.1 | 3.3 | 0.3 | White mushrooms. |
| `olive-oil` | SR Legacy | 171413 | Oil, olive, salad or cooking | 884 | 0.0 | 0.0 | 100.0 |  |
| `onion` | SR Legacy | 170000 | Onions, raw | 40 | 1.1 | 9.3 | 0.1 |  |
| `parmesan` | SR Legacy | 170848 | Cheese, parmesan, hard | 392 | 35.8 | 3.2 | 25.0 |  |
| `peanut-butter` | SR Legacy | 172470 | Peanut butter, smooth style, without salt | 598 | 22.2 | 22.3 | 51.4 | Smooth, without salt. |
| `peas` | SR Legacy | 170016 | Peas, green, frozen, unprepared (Includes foods for USDA's Food Distribution Program) | 77 | 5.2 | 13.6 | 0.4 |  |
| `potatoes` | SR Legacy | 170026 | Potatoes, flesh and skin, raw | 77 | 2.0 | 17.5 | 0.1 | Flesh and skin. |
| `prawns` | SR Legacy | 175180 | Crustaceans, shrimp, cooked | 99 | 24.0 | 0.2 | 0.3 |  |
| `quark` | Branded | 2440192 | QUARK SOFT CHEESE, QUARK (Appel Farms, LLC) | 82 | 10.0 | 4.5 | 2.7 | Manufacturer label values for plain quark; fat content varies by brand. |
| `quinoa` | SR Legacy | 168874 | Quinoa, uncooked | 368 | 14.1 | 64.2 | 6.1 |  |
| `red-lentils` | SR Legacy | 174284 | Lentils, pink or red, raw | 358 | 23.9 | 63.1 | 2.2 |  |
| `red-pepper` | SR Legacy | 170108 | Peppers, sweet, red, raw | 26 | 1.0 | 6.0 | 0.3 |  |
| `rice-cakes` | SR Legacy | 170250 | Snacks, rice cakes, brown rice, plain, unsalted | 387 | 8.2 | 81.5 | 2.8 |  |
| `rolled-oats` | SR Legacy | 173904 | Cereals, oats, regular and quick, not fortified, dry | 379 | 13.2 | 67.7 | 6.5 |  |
| `rye-bread` | SR Legacy | 174918 | Bread, pumpernickel | 250 | 8.7 | 47.5 | 3.1 | Pumpernickel, the closest match to dark wholegrain rye. |
| `salad-leaves` | SR Legacy | 169249 | Lettuce, green leaf, raw | 15 | 1.4 | 2.9 | 0.1 | Green leaf lettuce, as representative of mixed leaves. |
| `salmon` | SR Legacy | 175167 | Fish, salmon, Atlantic, farmed, raw | 208 | 20.4 | 0.0 | 13.4 | Atlantic salmon, farmed. |
| `skyr` | Branded | 2400949 | PLAIN ICELANDIC SKYR STRAINED NONFAT YOGURT, PLAIN (Schnuck Markets, Inc.) | 60 | 11.3 | 4.0 | 0.0 | Manufacturer label values for plain nonfat skyr; brands vary. |
| `smoked-salmon` | SR Legacy | 173687 | Fish, salmon, chinook, smoked | 117 | 18.3 | 0.0 | 4.3 |  |
| `soy-sauce` | SR Legacy | 172473 | Soy sauce made from soy and wheat (shoyu), low sodium | 57 | 9.1 | 5.6 | 0.3 | Shoyu, low sodium. |
| `spinach` | SR Legacy | 168462 | Spinach, raw | 23 | 2.9 | 3.6 | 0.4 |  |
| `spring-onions` | SR Legacy | 170005 | Onions, spring or scallions (includes tops and bulb), raw | 32 | 1.8 | 7.3 | 0.2 |  |
| `tofu` | SR Legacy | 172475 | Tofu, raw, firm, prepared with calcium sulfate | 144 | 17.3 | 2.8 | 8.7 | Firm tofu prepared with calcium sulfate. |
| `tuna` | SR Legacy | 171986 | Fish, tuna, light, canned in water, without salt, drained solids | 116 | 25.5 | 0.0 | 0.8 | Light tuna, canned in water, drained. |
| `turkey-mince` | SR Legacy | 174515 | Turkey, retail parts, breast, meat only, raw | 114 | 23.3 | 0.0 | 2.3 | Turkey breast meat, raw (lean breast mince). |
| `vegetable-stock` | SR Legacy | 171583 | Soup, vegetable broth, ready to serve | 5 | 0.2 | 0.9 | 0.1 | Vegetable broth, ready to serve. |
| `whey-protein` | SR Legacy | 173180 | Beverages, Protein powder whey based | 352 | 78.1 | 6.2 | 1.6 | Whey-based protein powder; brands vary. |
| `wholegrain-bread` | SR Legacy | 172688 | Bread, whole-wheat, commercially prepared | 252 | 12.4 | 42.7 | 3.5 | Whole-wheat bread, commercially prepared. |
| `wholemeal-wraps` | SR Legacy | 174081 | Tortillas, ready-to-bake or -fry, whole wheat | 310 | 9.8 | 45.9 | 9.8 | Whole-wheat tortillas. |
| `wholewheat-pasta` | SR Legacy | 169738 | Pasta, whole-wheat, dry (Includes foods for USDA's Food Distribution Program) | 352 | 13.9 | 73.4 | 2.9 |  |
