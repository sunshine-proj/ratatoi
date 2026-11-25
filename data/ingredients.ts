import type { IngredientInput } from "@/lib/ingredients/schema";

/**
 * Curated ingredient catalogue.
 *
 * Nutrition values are per 100 g (raw or as sold, as named) from USDA
 * FoodData Central, cited per ingredient in `source`:
 * - "SR Legacy": USDA's Standard Reference food-composition data (public domain).
 * - "Branded": manufacturers' declared label values held in FoodData Central,
 *   used only where no generic entry exists (skyr, quark, light coconut milk).
 * `fdcIds` are FoodData Central IDs; several ids are averaged (mixed berries).
 * Look one up at https://fdc.nal.usda.gov/food-details/<id>/nutrients.
 *
 * Note: carbohydrate is USDA's "carbohydrate by difference", which includes
 * fibre; EU labels exclude fibre, so carbohydrate can read slightly higher
 * than on a European pack.
 *
 * Ingredients with `per100g: null` are used in amounts too small to matter
 * (dried spices, fresh herbs, baking powder) and have no source.
 *
 * Allergens follow the 14 EU-declared allergens. Processed items (stock,
 * soy sauce, hummus, bread) list the allergens they typically contain;
 * products vary, so the UI always tells users to check labels.
 */
const v = (kcal: number, proteinG: number, carbsG: number, fatG: number) => ({ kcal, proteinG, carbsG, fatG });

export const ingredientData: IngredientInput[] = [
  // --- Dairy and eggs -------------------------------------------------------
  { key: "eggs", name: "Eggs", aliases: ["egg", "free-range eggs"], category: "dairy_eggs", kind: "egg", allergens: ["eggs"], per100g: v(143, 12.6, 0.7, 9.5), source: { dataset: "SR Legacy", fdcIds: [171287] }, singularName: "Egg", gramsPerPiece: 50 },
  { key: "egg-whites", name: "Liquid egg whites", aliases: ["egg white", "egg whites"], category: "dairy_eggs", kind: "egg", allergens: ["eggs"], per100g: v(52, 10.9, 0.7, 0.2), source: { dataset: "SR Legacy", fdcIds: [172183] }, gramsPerMl: 1.03 },
  { key: "greek-yoghurt", name: "Fat-free Greek yoghurt", aliases: ["greek yoghurt", "greek yogurt", "0% greek yoghurt", "yoghurt", "yogurt"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(59, 10.2, 3.6, 0.4), source: { dataset: "SR Legacy", fdcIds: [170894] } },
  { key: "skyr", name: "Plain skyr", aliases: ["skyr", "icelandic yoghurt"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(60, 11.3, 4, 0), source: { dataset: "Branded", fdcIds: [2400949], note: "Manufacturer label values for plain nonfat skyr; brands vary." } },
  { key: "cottage-cheese", name: "Low-fat cottage cheese", aliases: ["cottage cheese"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(81, 10.4, 4.8, 2.3), source: { dataset: "SR Legacy", fdcIds: [172182], note: "2% milkfat cottage cheese." } },
  { key: "quark", name: "Quark", aliases: ["low-fat quark", "curd cheese"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(82, 10, 4.5, 2.7), source: { dataset: "Branded", fdcIds: [2440192], note: "Manufacturer label values for plain quark; fat content varies by brand." } },
  { key: "milk", name: "Semi-skimmed milk", aliases: ["milk", "semi skimmed milk", "semi-skimmed"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(50, 3.3, 4.8, 2), source: { dataset: "SR Legacy", fdcIds: [171267], note: "2% milkfat, the closest match to EU semi-skimmed milk (1.5\u20131.8% fat)." }, gramsPerMl: 1.03 },
  { key: "feta", name: "Feta", aliases: ["feta cheese"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(265, 14.2, 3.9, 21.5), source: { dataset: "SR Legacy", fdcIds: [173420] } },
  { key: "parmesan", name: "Parmesan", aliases: ["parmigiano", "parmigiano reggiano", "grana padano"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(392, 35.8, 3.2, 25), source: { dataset: "SR Legacy", fdcIds: [170848] } },

  // --- Meat and fish --------------------------------------------------------
  { key: "chicken-breast", name: "Chicken breast", aliases: ["chicken", "chicken fillet", "chicken breasts"], category: "meat_fish", kind: "meat", allergens: [], per100g: v(120, 22.5, 0, 2.6), source: { dataset: "SR Legacy", fdcIds: [171077] } },
  { key: "turkey-mince", name: "Turkey breast mince", aliases: ["turkey mince", "minced turkey", "ground turkey"], category: "meat_fish", kind: "meat", allergens: [], per100g: v(114, 23.3, 0, 2.3), source: { dataset: "SR Legacy", fdcIds: [174515], note: "Turkey breast meat, raw (lean breast mince)." } },
  { key: "lean-beef-mince", name: "Lean beef mince (5% fat)", aliases: ["beef mince", "minced beef", "ground beef", "lean mince"], category: "meat_fish", kind: "meat", allergens: [], per100g: v(137, 21.4, 0, 5), source: { dataset: "SR Legacy", fdcIds: [171790] } },
  { key: "salmon", name: "Salmon fillet", aliases: ["salmon", "salmon fillets"], category: "meat_fish", kind: "fish", allergens: ["fish"], per100g: v(208, 20.4, 0, 13.4), source: { dataset: "SR Legacy", fdcIds: [175167], note: "Atlantic salmon, farmed." } },
  { key: "smoked-salmon", name: "Smoked salmon", aliases: ["cold-smoked salmon", "lox"], category: "meat_fish", kind: "fish", allergens: ["fish"], per100g: v(117, 18.3, 0, 4.3), source: { dataset: "SR Legacy", fdcIds: [173687] } },
  { key: "cod", name: "Cod fillet", aliases: ["cod", "white fish"], category: "meat_fish", kind: "fish", allergens: ["fish"], per100g: v(82, 17.8, 0, 0.7), source: { dataset: "SR Legacy", fdcIds: [171955] } },
  { key: "prawns", name: "Cooked king prawns", aliases: ["prawns", "king prawns", "shrimp"], category: "meat_fish", kind: "shellfish", allergens: ["crustaceans"], per100g: v(99, 24, 0.2, 0.3), source: { dataset: "SR Legacy", fdcIds: [175180] } },

  // --- Chilled and plant protein -------------------------------------------
  { key: "tofu", name: "Firm tofu", aliases: ["tofu", "bean curd"], category: "chilled", kind: "plant", allergens: ["soya"], per100g: v(144, 17.3, 2.8, 8.7), source: { dataset: "SR Legacy", fdcIds: [172475], note: "Firm tofu prepared with calcium sulfate." } },
  { key: "hummus", name: "Hummus", aliases: ["houmous", "humous"], category: "chilled", kind: "plant", allergens: ["sesame"], per100g: v(237, 7.8, 15, 17.8), source: { dataset: "SR Legacy", fdcIds: [174289], note: "Commercial hummus." } },

  // --- Fruit and vegetables -------------------------------------------------
  { key: "banana", name: "Bananas", aliases: ["banana"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(89, 1.1, 22.8, 0.3), source: { dataset: "SR Legacy", fdcIds: [173944] }, singularName: "Banana", gramsPerPiece: 120 },
  { key: "blueberries", name: "Blueberries", aliases: ["blueberry"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(57, 0.7, 14.5, 0.3), source: { dataset: "SR Legacy", fdcIds: [171711] } },
  { key: "lemon", name: "Lemons", aliases: ["lemon", "lemon juice"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(29, 1.1, 9.3, 0.3), source: { dataset: "SR Legacy", fdcIds: [167746], note: "Without peel." }, singularName: "Lemon", gramsPerPiece: 100 },
  { key: "potatoes", name: "Potatoes", aliases: ["potato", "new potatoes"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(77, 2, 17.5, 0.1), source: { dataset: "SR Legacy", fdcIds: [170026], note: "Flesh and skin." } },
  { key: "broccoli", name: "Broccoli", aliases: ["tenderstem broccoli"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(34, 2.8, 6.6, 0.4), source: { dataset: "SR Legacy", fdcIds: [170379] } },
  { key: "spinach", name: "Baby spinach", aliases: ["spinach"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(23, 2.9, 3.6, 0.4), source: { dataset: "SR Legacy", fdcIds: [168462] } },
  { key: "salad-leaves", name: "Mixed salad leaves", aliases: ["salad", "salad leaves", "lettuce", "rocket"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(15, 1.4, 2.9, 0.1), source: { dataset: "SR Legacy", fdcIds: [169249], note: "Green leaf lettuce, as representative of mixed leaves." } },
  { key: "red-pepper", name: "Red peppers", aliases: ["red pepper", "bell pepper", "peppers", "pepper"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(26, 1, 6, 0.3), source: { dataset: "SR Legacy", fdcIds: [170108] }, singularName: "Red pepper", gramsPerPiece: 150 },
  { key: "onion", name: "Onions", aliases: ["onion", "red onion", "brown onion", "yellow onion"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(40, 1.1, 9.3, 0.1), source: { dataset: "SR Legacy", fdcIds: [170000] }, singularName: "Onion", gramsPerPiece: 150 },
  { key: "garlic", name: "Garlic", aliases: ["garlic clove", "garlic cloves"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(149, 6.4, 33.1, 0.5), source: { dataset: "SR Legacy", fdcIds: [169230] }, gramsPerPiece: 5, pieceName: { one: "clove", other: "cloves" } },
  { key: "ginger", name: "Fresh ginger", aliases: ["ginger", "ginger root"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(80, 1.8, 17.8, 0.8), source: { dataset: "SR Legacy", fdcIds: [169231] } },
  { key: "spring-onions", name: "Spring onions", aliases: ["spring onion", "scallions", "green onions"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(32, 1.8, 7.3, 0.2), source: { dataset: "SR Legacy", fdcIds: [170005] }, singularName: "Spring onion", gramsPerPiece: 15 },
  { key: "cherry-tomatoes", name: "Cherry tomatoes", aliases: ["cherry tomato", "tomatoes", "tomato"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(18, 0.9, 3.9, 0.2), source: { dataset: "SR Legacy", fdcIds: [170457], note: "Red ripe tomatoes, year-round average." } },
  { key: "cucumber", name: "Cucumber", aliases: ["cucumbers"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(15, 0.7, 3.6, 0.1), source: { dataset: "SR Legacy", fdcIds: [168409], note: "With peel." } },
  { key: "carrots", name: "Carrots", aliases: ["carrot"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(41, 0.9, 9.6, 0.2), source: { dataset: "SR Legacy", fdcIds: [170393] }, singularName: "Carrot", gramsPerPiece: 80 },
  { key: "courgettes", name: "Courgettes", aliases: ["courgette", "zucchini"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(17, 1.2, 3.1, 0.3), source: { dataset: "SR Legacy", fdcIds: [169291], note: "Zucchini, including skin." }, singularName: "Courgette", gramsPerPiece: 200 },
  { key: "mushrooms", name: "Mushrooms", aliases: ["mushroom", "chestnut mushrooms", "button mushrooms"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(22, 3.1, 3.3, 0.3), source: { dataset: "SR Legacy", fdcIds: [169251], note: "White mushrooms." } },
  { key: "fresh-parsley", name: "Fresh parsley", aliases: ["parsley"], category: "fruit_veg", kind: "plant", allergens: [], per100g: null },
  { key: "fresh-dill", name: "Fresh dill", aliases: ["dill"], category: "fruit_veg", kind: "plant", allergens: [], per100g: null },
  { key: "fresh-coriander", name: "Fresh coriander", aliases: ["coriander", "cilantro"], category: "fruit_veg", kind: "plant", allergens: [], per100g: null },

  // --- Bakery ---------------------------------------------------------------
  { key: "wholegrain-bread", name: "Wholegrain bread", aliases: ["bread", "wholemeal bread", "brown bread"], category: "bakery", kind: "plant", allergens: ["gluten"], per100g: v(252, 12.4, 42.7, 3.5), source: { dataset: "SR Legacy", fdcIds: [172688], note: "Whole-wheat bread, commercially prepared." }, gramsPerPiece: 40, pieceName: { one: "slice", other: "slices" } },
  { key: "rye-bread", name: "Wholegrain rye bread", aliases: ["rye bread", "dark rye bread"], category: "bakery", kind: "plant", allergens: ["gluten"], per100g: v(250, 8.7, 47.5, 3.1), source: { dataset: "SR Legacy", fdcIds: [174918], note: "Pumpernickel, the closest match to dark wholegrain rye." }, gramsPerPiece: 35, pieceName: { one: "slice", other: "slices" } },
  { key: "wholemeal-wraps", name: "Wholemeal wraps", aliases: ["wraps", "wrap", "tortillas", "tortilla"], category: "bakery", kind: "plant", allergens: ["gluten"], per100g: v(310, 9.8, 45.9, 9.8), source: { dataset: "SR Legacy", fdcIds: [174081], note: "Whole-wheat tortillas." }, singularName: "Wholemeal wrap", gramsPerPiece: 60 },

  // --- Frozen ---------------------------------------------------------------
  { key: "mixed-berries", name: "Frozen mixed berries", aliases: ["mixed berries", "frozen berries", "berries"], category: "frozen", kind: "plant", allergens: [], per100g: v(52, 0.8, 12.4, 0.5), source: { dataset: "SR Legacy", fdcIds: [168173, 168209, 173950, 171710], note: "Average of frozen unsweetened strawberries, raspberries, blueberries, and blackberries." } },
  { key: "edamame", name: "Frozen edamame beans (shelled)", aliases: ["edamame", "soy beans", "soya beans"], category: "frozen", kind: "plant", allergens: ["soya"], per100g: v(109, 11.2, 7.6, 4.7), source: { dataset: "SR Legacy", fdcIds: [168410] } },
  { key: "peas", name: "Frozen peas", aliases: ["peas", "garden peas", "petits pois"], category: "frozen", kind: "plant", allergens: [], per100g: v(77, 5.2, 13.6, 0.4), source: { dataset: "SR Legacy", fdcIds: [170016] } },

  // --- Pantry ---------------------------------------------------------------
  { key: "rolled-oats", name: "Rolled oats", aliases: ["oats", "porridge oats", "oatmeal"], category: "pantry", kind: "plant", allergens: ["gluten"], per100g: v(379, 13.2, 67.7, 6.5), source: { dataset: "SR Legacy", fdcIds: [173904] } },
  { key: "whey-protein", name: "Whey protein powder (vanilla)", aliases: ["whey", "whey protein", "protein powder"], category: "pantry", kind: "dairy", allergens: ["milk"], per100g: v(352, 78.1, 6.2, 1.6), source: { dataset: "SR Legacy", fdcIds: [173180], note: "Whey-based protein powder; brands vary." } },
  { key: "tuna", name: "Tuna in spring water (drained)", aliases: ["tuna", "canned tuna", "tinned tuna"], category: "pantry", kind: "fish", allergens: ["fish"], per100g: v(116, 25.5, 0, 0.8), source: { dataset: "SR Legacy", fdcIds: [171986], note: "Light tuna, canned in water, drained." } },
  { key: "chickpeas", name: "Chickpeas (canned, drained)", aliases: ["chickpeas", "chick peas", "garbanzo beans"], category: "pantry", kind: "plant", allergens: [], per100g: v(138, 7, 22.9, 2.5), source: { dataset: "SR Legacy", fdcIds: [173801], note: "Canned, drained and rinsed." } },
  { key: "black-beans", name: "Black beans (canned, drained)", aliases: ["black beans", "turtle beans"], category: "pantry", kind: "plant", allergens: [], per100g: v(132, 8.9, 23.7, 0.5), source: { dataset: "SR Legacy", fdcIds: [173735], note: "Cooked black beans, as the closest match to canned beans drained." } },
  { key: "red-lentils", name: "Red lentils (dried)", aliases: ["red lentils", "lentils"], category: "pantry", kind: "plant", allergens: [], per100g: v(358, 23.9, 63.1, 2.2), source: { dataset: "SR Legacy", fdcIds: [174284] } },
  { key: "quinoa", name: "Quinoa (dried)", aliases: ["quinoa"], category: "pantry", kind: "plant", allergens: [], per100g: v(368, 14.1, 64.2, 6.1), source: { dataset: "SR Legacy", fdcIds: [168874] } },
  { key: "brown-rice", name: "Brown rice (dried)", aliases: ["brown rice", "wholegrain rice"], category: "pantry", kind: "plant", allergens: [], per100g: v(367, 7.5, 76.2, 3.2), source: { dataset: "SR Legacy", fdcIds: [169703] } },
  { key: "basmati-rice", name: "Basmati rice (dried)", aliases: ["basmati", "rice", "white rice"], category: "pantry", kind: "plant", allergens: [], per100g: v(365, 7.1, 80, 0.7), source: { dataset: "SR Legacy", fdcIds: [168877], note: "White long-grain rice, raw." } },
  { key: "wholewheat-pasta", name: "Wholewheat pasta (dried)", aliases: ["pasta", "wholemeal pasta", "spaghetti", "penne"], category: "pantry", kind: "plant", allergens: ["gluten"], per100g: v(352, 13.9, 73.4, 2.9), source: { dataset: "SR Legacy", fdcIds: [169738] } },
  { key: "rice-cakes", name: "Rice cakes", aliases: ["rice cake", "puffed rice cakes"], category: "pantry", kind: "plant", allergens: [], per100g: v(387, 8.2, 81.5, 2.8), source: { dataset: "SR Legacy", fdcIds: [170250] }, singularName: "Rice cake", gramsPerPiece: 9 },
  { key: "canned-tomatoes", name: "Chopped tomatoes (canned)", aliases: ["chopped tomatoes", "canned tomatoes", "tinned tomatoes"], category: "pantry", kind: "plant", allergens: [], per100g: v(16, 0.8, 3.5, 0.2), source: { dataset: "SR Legacy", fdcIds: [170051], note: "Canned in tomato juice." } },
  { key: "light-coconut-milk", name: "Light coconut milk", aliases: ["coconut milk", "reduced-fat coconut milk"], category: "pantry", kind: "plant", allergens: [], per100g: v(57, 1.3, 1.3, 5.7), source: { dataset: "Branded", fdcIds: [2432016], note: "Manufacturer label values for light coconut milk; brands vary." }, gramsPerMl: 1 },
  { key: "vegetable-stock", name: "Vegetable stock (made up)", aliases: ["vegetable stock", "stock", "broth", "bouillon"], category: "pantry", kind: "plant", allergens: ["celery"], per100g: v(5, 0.2, 0.9, 0.1), source: { dataset: "SR Legacy", fdcIds: [171583], note: "Vegetable broth, ready to serve." }, gramsPerMl: 1 },
  { key: "olive-oil", name: "Olive oil", aliases: ["extra virgin olive oil", "oil"], category: "pantry", kind: "plant", allergens: [], per100g: v(884, 0, 0, 100), source: { dataset: "SR Legacy", fdcIds: [171413] }, gramsPerMl: 0.92 },
  { key: "peanut-butter", name: "Peanut butter", aliases: ["peanut butter", "pb"], category: "pantry", kind: "plant", allergens: ["peanuts"], per100g: v(598, 22.2, 22.3, 51.4), source: { dataset: "SR Legacy", fdcIds: [172470], note: "Smooth, without salt." }, gramsPerMl: 1.1 },
  { key: "chia-seeds", name: "Chia seeds", aliases: ["chia"], category: "pantry", kind: "plant", allergens: [], per100g: v(486, 16.5, 42.1, 30.7), source: { dataset: "SR Legacy", fdcIds: [170554] }, gramsPerMl: 0.65 },
  { key: "honey", name: "Honey", aliases: ["runny honey"], category: "pantry", kind: "honey", allergens: [], per100g: v(304, 0.3, 82.4, 0), source: { dataset: "SR Legacy", fdcIds: [169640] }, gramsPerMl: 1.42 },
  { key: "cocoa-powder", name: "Cocoa powder (unsweetened)", aliases: ["cocoa", "cacao powder"], category: "pantry", kind: "plant", allergens: [], per100g: v(228, 19.6, 57.9, 13.7), source: { dataset: "SR Legacy", fdcIds: [169593] }, gramsPerMl: 0.5 },
  { key: "soy-sauce", name: "Reduced-salt soy sauce", aliases: ["soy sauce", "soya sauce", "shoyu"], category: "pantry", kind: "plant", allergens: ["soya", "gluten"], per100g: v(57, 9.1, 5.6, 0.3), source: { dataset: "SR Legacy", fdcIds: [172473], note: "Shoyu, low sodium." }, gramsPerMl: 1.1 },
  { key: "baking-powder", name: "Baking powder", aliases: [], category: "pantry", kind: "plant", allergens: [], per100g: null },

  // --- Herbs and spices -----------------------------------------------------
  { key: "ground-cumin", name: "Ground cumin", aliases: ["cumin"], category: "herbs_spices", kind: "plant", allergens: [], per100g: null },
  { key: "smoked-paprika", name: "Smoked paprika", aliases: ["paprika"], category: "herbs_spices", kind: "plant", allergens: [], per100g: null },
  { key: "chilli-flakes", name: "Chilli flakes", aliases: ["chili flakes", "red pepper flakes", "chilli"], category: "herbs_spices", kind: "plant", allergens: [], per100g: null },
  { key: "ground-cinnamon", name: "Ground cinnamon", aliases: ["cinnamon"], category: "herbs_spices", kind: "plant", allergens: [], per100g: null },
  { key: "ground-turmeric", name: "Ground turmeric", aliases: ["turmeric"], category: "herbs_spices", kind: "plant", allergens: [], per100g: null },
  { key: "curry-powder", name: "Mild curry powder", aliases: ["curry powder", "curry spice"], category: "herbs_spices", kind: "plant", allergens: [], per100g: null },
  { key: "dried-herbs", name: "Dried mixed herbs", aliases: ["mixed herbs", "italian herbs", "dried oregano", "oregano"], category: "herbs_spices", kind: "plant", allergens: [], per100g: null },
];
