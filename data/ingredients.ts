import type { IngredientInput } from "@/lib/ingredients/schema";

/**
 * Curated ingredient catalogue.
 *
 * Nutrition values are APPROXIMATE typical values per 100 g (raw or as sold,
 * as named), compiled by the Protein Plate team for planning estimates.
 * They are not taken from, or verified against, a specific food-composition
 * database. Check them against an authoritative source (e.g. a national
 * food-composition table) before relying on them publicly.
 *
 * Allergens follow the 14 EU-declared allergens. Processed items (stock,
 * soy sauce, hummus, bread) list the allergens they typically contain;
 * products vary, so the UI always tells users to check labels.
 */
const v = (kcal: number, proteinG: number, carbsG: number, fatG: number) => ({ kcal, proteinG, carbsG, fatG });

export const ingredientData: IngredientInput[] = [
  // --- Dairy and eggs -------------------------------------------------------
  { key: "eggs", name: "Eggs", aliases: ["egg", "free-range eggs"], category: "dairy_eggs", kind: "egg", allergens: ["eggs"], per100g: v(143, 12.6, 0.7, 9.5), singularName: "Egg", gramsPerPiece: 50 },
  { key: "egg-whites", name: "Liquid egg whites", aliases: ["egg white", "egg whites"], category: "dairy_eggs", kind: "egg", allergens: ["eggs"], per100g: v(52, 10.9, 0.7, 0.2), gramsPerMl: 1.03 },
  { key: "greek-yoghurt", name: "Fat-free Greek yoghurt", aliases: ["greek yoghurt", "greek yogurt", "0% greek yoghurt", "yoghurt", "yogurt"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(59, 10.3, 3.6, 0.4) },
  { key: "skyr", name: "Plain skyr", aliases: ["skyr", "icelandic yoghurt"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(63, 11, 4, 0.2) },
  { key: "cottage-cheese", name: "Low-fat cottage cheese", aliases: ["cottage cheese"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(81, 10.5, 3.4, 2.3) },
  { key: "quark", name: "Low-fat quark", aliases: ["quark", "curd cheese"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(67, 12, 4, 0.2) },
  { key: "milk", name: "Semi-skimmed milk", aliases: ["milk", "semi skimmed milk", "semi-skimmed"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(47, 3.4, 4.8, 1.6), gramsPerMl: 1.03 },
  { key: "feta", name: "Feta", aliases: ["feta cheese"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(264, 14, 4, 21) },
  { key: "parmesan", name: "Parmesan", aliases: ["parmigiano", "parmigiano reggiano", "grana padano"], category: "dairy_eggs", kind: "dairy", allergens: ["milk"], per100g: v(392, 35.8, 3.2, 25.8) },

  // --- Meat and fish --------------------------------------------------------
  { key: "chicken-breast", name: "Chicken breast", aliases: ["chicken", "chicken fillet", "chicken breasts"], category: "meat_fish", kind: "meat", allergens: [], per100g: v(120, 22.5, 0, 2.6) },
  { key: "turkey-mince", name: "Turkey breast mince", aliases: ["turkey mince", "minced turkey", "ground turkey"], category: "meat_fish", kind: "meat", allergens: [], per100g: v(121, 22, 0, 3.5) },
  { key: "lean-beef-mince", name: "Lean beef mince (5% fat)", aliases: ["beef mince", "minced beef", "ground beef", "lean mince"], category: "meat_fish", kind: "meat", allergens: [], per100g: v(137, 21, 0, 5.5) },
  { key: "salmon", name: "Salmon fillet", aliases: ["salmon", "salmon fillets"], category: "meat_fish", kind: "fish", allergens: ["fish"], per100g: v(208, 20.4, 0, 13.4) },
  { key: "smoked-salmon", name: "Smoked salmon", aliases: ["cold-smoked salmon", "lox"], category: "meat_fish", kind: "fish", allergens: ["fish"], per100g: v(117, 18.3, 0, 4.3) },
  { key: "cod", name: "Cod fillet", aliases: ["cod", "white fish"], category: "meat_fish", kind: "fish", allergens: ["fish"], per100g: v(82, 17.8, 0, 0.7) },
  { key: "prawns", name: "Cooked king prawns", aliases: ["prawns", "king prawns", "shrimp"], category: "meat_fish", kind: "shellfish", allergens: ["crustaceans"], per100g: v(99, 24, 0.2, 0.3) },

  // --- Chilled and plant protein -------------------------------------------
  { key: "tofu", name: "Firm tofu", aliases: ["tofu", "bean curd"], category: "chilled", kind: "plant", allergens: ["soya"], per100g: v(144, 17.3, 2.8, 8.7) },
  { key: "hummus", name: "Hummus", aliases: ["houmous", "humous"], category: "chilled", kind: "plant", allergens: ["sesame"], per100g: v(250, 7, 14, 18) },

  // --- Fruit and vegetables -------------------------------------------------
  { key: "banana", name: "Bananas", aliases: ["banana"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(89, 1.1, 22.8, 0.3), singularName: "Banana", gramsPerPiece: 120 },
  { key: "blueberries", name: "Blueberries", aliases: ["blueberry"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(57, 0.7, 14.5, 0.3) },
  { key: "lemon", name: "Lemons", aliases: ["lemon", "lemon juice"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(29, 1.1, 9.3, 0.3), singularName: "Lemon", gramsPerPiece: 100 },
  { key: "potatoes", name: "Potatoes", aliases: ["potato", "new potatoes"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(77, 2, 17, 0.1) },
  { key: "broccoli", name: "Broccoli", aliases: ["tenderstem broccoli"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(34, 2.8, 7, 0.4) },
  { key: "spinach", name: "Baby spinach", aliases: ["spinach"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(23, 2.9, 3.6, 0.4) },
  { key: "salad-leaves", name: "Mixed salad leaves", aliases: ["salad", "salad leaves", "lettuce", "rocket"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(17, 1.4, 2.9, 0.2) },
  { key: "red-pepper", name: "Red peppers", aliases: ["red pepper", "bell pepper", "peppers", "pepper"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(31, 1, 6, 0.3), singularName: "Red pepper", gramsPerPiece: 150 },
  { key: "onion", name: "Onions", aliases: ["onion", "red onion", "brown onion", "yellow onion"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(40, 1.1, 9.3, 0.1), singularName: "Onion", gramsPerPiece: 150 },
  { key: "garlic", name: "Garlic", aliases: ["garlic clove", "garlic cloves"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(149, 6.4, 33, 0.5), gramsPerPiece: 5, pieceName: { one: "clove", other: "cloves" } },
  { key: "ginger", name: "Fresh ginger", aliases: ["ginger", "ginger root"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(80, 1.8, 18, 0.8) },
  { key: "spring-onions", name: "Spring onions", aliases: ["spring onion", "scallions", "green onions"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(32, 1.8, 7.3, 0.2), singularName: "Spring onion", gramsPerPiece: 15 },
  { key: "cherry-tomatoes", name: "Cherry tomatoes", aliases: ["cherry tomato", "tomatoes", "tomato"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(18, 0.9, 3.9, 0.2) },
  { key: "cucumber", name: "Cucumber", aliases: ["cucumbers"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(15, 0.7, 3.6, 0.1) },
  { key: "carrots", name: "Carrots", aliases: ["carrot"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(41, 0.9, 9.6, 0.2), singularName: "Carrot", gramsPerPiece: 80 },
  { key: "courgettes", name: "Courgettes", aliases: ["courgette", "zucchini"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(17, 1.2, 3.1, 0.3), singularName: "Courgette", gramsPerPiece: 200 },
  { key: "mushrooms", name: "Mushrooms", aliases: ["mushroom", "chestnut mushrooms", "button mushrooms"], category: "fruit_veg", kind: "plant", allergens: [], per100g: v(22, 3.1, 3.3, 0.3) },
  { key: "fresh-parsley", name: "Fresh parsley", aliases: ["parsley"], category: "fruit_veg", kind: "plant", allergens: [], per100g: null },
  { key: "fresh-dill", name: "Fresh dill", aliases: ["dill"], category: "fruit_veg", kind: "plant", allergens: [], per100g: null },
  { key: "fresh-coriander", name: "Fresh coriander", aliases: ["coriander", "cilantro"], category: "fruit_veg", kind: "plant", allergens: [], per100g: null },

  // --- Bakery ---------------------------------------------------------------
  { key: "wholegrain-bread", name: "Wholegrain bread", aliases: ["bread", "wholemeal bread", "brown bread"], category: "bakery", kind: "plant", allergens: ["gluten"], per100g: v(247, 10.7, 41.3, 3.4), gramsPerPiece: 40, pieceName: { one: "slice", other: "slices" } },
  { key: "rye-bread", name: "Wholegrain rye bread", aliases: ["rye bread", "dark rye bread"], category: "bakery", kind: "plant", allergens: ["gluten"], per100g: v(200, 6, 38, 1.5), gramsPerPiece: 35, pieceName: { one: "slice", other: "slices" } },
  { key: "wholemeal-wraps", name: "Wholemeal wraps", aliases: ["wraps", "wrap", "tortillas", "tortilla"], category: "bakery", kind: "plant", allergens: ["gluten"], per100g: v(290, 9, 48, 6.5), singularName: "Wholemeal wrap", gramsPerPiece: 60 },

  // --- Frozen ---------------------------------------------------------------
  { key: "mixed-berries", name: "Frozen mixed berries", aliases: ["mixed berries", "frozen berries", "berries"], category: "frozen", kind: "plant", allergens: [], per100g: v(50, 1, 11, 0.3) },
  { key: "edamame", name: "Frozen edamame beans (shelled)", aliases: ["edamame", "soy beans", "soya beans"], category: "frozen", kind: "plant", allergens: ["soya"], per100g: v(121, 11.9, 8.9, 5.2) },
  { key: "peas", name: "Frozen peas", aliases: ["peas", "garden peas", "petits pois"], category: "frozen", kind: "plant", allergens: [], per100g: v(81, 5.4, 14, 0.4) },

  // --- Pantry ---------------------------------------------------------------
  { key: "rolled-oats", name: "Rolled oats", aliases: ["oats", "porridge oats", "oatmeal"], category: "pantry", kind: "plant", allergens: ["gluten"], per100g: v(379, 13.2, 67.7, 6.5) },
  { key: "whey-protein", name: "Whey protein powder (vanilla)", aliases: ["whey", "whey protein", "protein powder"], category: "pantry", kind: "dairy", allergens: ["milk"], per100g: v(380, 75, 8, 5) },
  { key: "tuna", name: "Tuna in spring water (drained)", aliases: ["tuna", "canned tuna", "tinned tuna"], category: "pantry", kind: "fish", allergens: ["fish"], per100g: v(116, 25.5, 0, 0.8) },
  { key: "chickpeas", name: "Chickpeas (canned, drained)", aliases: ["chickpeas", "chick peas", "garbanzo beans"], category: "pantry", kind: "plant", allergens: [], per100g: v(120, 7, 18, 2.6) },
  { key: "black-beans", name: "Black beans (canned, drained)", aliases: ["black beans", "turtle beans"], category: "pantry", kind: "plant", allergens: [], per100g: v(114, 7.5, 17, 0.5) },
  { key: "red-lentils", name: "Red lentils (dried)", aliases: ["red lentils", "lentils"], category: "pantry", kind: "plant", allergens: [], per100g: v(358, 24, 60, 2.2) },
  { key: "quinoa", name: "Quinoa (dried)", aliases: ["quinoa"], category: "pantry", kind: "plant", allergens: [], per100g: v(368, 14.1, 64, 6.1) },
  { key: "brown-rice", name: "Brown rice (dried)", aliases: ["brown rice", "wholegrain rice"], category: "pantry", kind: "plant", allergens: [], per100g: v(365, 7.5, 76, 2.7) },
  { key: "basmati-rice", name: "Basmati rice (dried)", aliases: ["basmati", "rice", "white rice"], category: "pantry", kind: "plant", allergens: [], per100g: v(352, 8, 78, 0.6) },
  { key: "wholewheat-pasta", name: "Wholewheat pasta (dried)", aliases: ["pasta", "wholemeal pasta", "spaghetti", "penne"], category: "pantry", kind: "plant", allergens: ["gluten"], per100g: v(348, 13, 66, 2.5) },
  { key: "rice-cakes", name: "Rice cakes", aliases: ["rice cake", "puffed rice cakes"], category: "pantry", kind: "plant", allergens: [], per100g: v(387, 8, 81, 2.8), singularName: "Rice cake", gramsPerPiece: 9 },
  { key: "canned-tomatoes", name: "Chopped tomatoes (canned)", aliases: ["chopped tomatoes", "canned tomatoes", "tinned tomatoes"], category: "pantry", kind: "plant", allergens: [], per100g: v(21, 1.2, 3.5, 0.2) },
  { key: "light-coconut-milk", name: "Light coconut milk", aliases: ["coconut milk", "reduced-fat coconut milk"], category: "pantry", kind: "plant", allergens: [], per100g: v(73, 0.7, 2.7, 6.8), gramsPerMl: 1 },
  { key: "vegetable-stock", name: "Vegetable stock (made up)", aliases: ["vegetable stock", "stock", "broth", "bouillon"], category: "pantry", kind: "plant", allergens: ["celery"], per100g: v(5, 0.2, 0.6, 0.2), gramsPerMl: 1 },
  { key: "olive-oil", name: "Olive oil", aliases: ["extra virgin olive oil", "oil"], category: "pantry", kind: "plant", allergens: [], per100g: v(884, 0, 0, 100), gramsPerMl: 0.92 },
  { key: "peanut-butter", name: "Peanut butter", aliases: ["peanut butter", "pb"], category: "pantry", kind: "plant", allergens: ["peanuts"], per100g: v(588, 25, 20, 50), gramsPerMl: 1.1 },
  { key: "chia-seeds", name: "Chia seeds", aliases: ["chia"], category: "pantry", kind: "plant", allergens: [], per100g: v(486, 16.5, 42, 30.7), gramsPerMl: 0.65 },
  { key: "honey", name: "Honey", aliases: ["runny honey"], category: "pantry", kind: "honey", allergens: [], per100g: v(304, 0.3, 82, 0), gramsPerMl: 1.42 },
  { key: "cocoa-powder", name: "Cocoa powder (unsweetened)", aliases: ["cocoa", "cacao powder"], category: "pantry", kind: "plant", allergens: [], per100g: v(228, 19.6, 58, 13.7), gramsPerMl: 0.5 },
  { key: "soy-sauce", name: "Reduced-salt soy sauce", aliases: ["soy sauce", "soya sauce", "shoyu"], category: "pantry", kind: "plant", allergens: ["soya", "gluten"], per100g: v(60, 8, 5.6, 0.1), gramsPerMl: 1.1 },
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
