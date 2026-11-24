# Product Requirements Document — Protein Meal Planner PWA

**Status:** MVP definition  
**Working name:** Protein Plate  
**Product type:** Mobile-first Progressive Web App  
**Primary audience:** Adults who want a practical high-protein eating plan, with particular interest in high-protein, lower-calorie meals and snacks.

## 1. Product vision

Help users follow a protein-focused eating pattern without having to research every meal, calculate every macro, or manually build a grocery list.

The app combines:
- Personal nutrition goals
- A visual recipe library
- Breakfast, lunch, dinner, and snack planning
- Per-meal and per-day nutrition summaries
- An automatically generated, editable shopping list

The product is a planning and education tool, not a medical device or a substitute for professional nutrition advice.

## 2. Problem statement

People trying to eat more protein often struggle to:
- Find appealing recipes that fit their calorie and protein goals.
- Find snack ideas that are both high in protein and relatively low in calories.
- Plan a whole week rather than individual meals.
- Understand how each meal contributes to daily targets.
- Turn several recipes into one consolidated shopping list.
- Keep a plan flexible when ingredients or preferences change.

Existing tools may be strong at macro tracking, recipe inspiration, or grocery lists, but users want these capabilities connected in one simple workflow.

## 3. Goals and non-goals

### MVP goals

1. Let users set a daily calorie target and protein target.
2. Let users optionally set carbohydrate and fat targets.
3. Provide a visual recipe catalogue with nutrition information.
4. Make high-protein, lower-calorie snacks easy to discover.
5. Let users build a weekly meal plan with multiple snacks per day.
6. Show per-meal and daily nutrition totals against the user's targets.
7. Generate an editable shopping list from the selected meal plan.
8. Work well on mobile and be installable as a PWA.
9. Persist a user's plan and preferences between sessions.

### Non-goals for MVP

- Medical diagnosis or treatment plans.
- Automatically prescribing nutrition targets.
- Weight-loss guarantees or body-composition predictions.
- Direct supermarket checkout or guaranteed live supermarket prices.
- Barcode scanning.
- Social network, public profiles, recipe comments, or creator marketplace.
- AI dietitian or medical chatbot.
- Integration with wearables or fitness trackers.
- Full micronutrient analysis.
- Guaranteed local product availability in Lithuania or other markets.

## 4. Target users and jobs to be done

### Persona A — Fat-loss and muscle-retention user

Wants to reduce body fat while keeping protein intake high.

**Job:** “Help me plan satisfying meals and snacks that fit my calorie budget and give me enough protein.”

### Persona B — Muscle-building user

Wants consistent protein intake and a meal routine that supports training.

**Job:** “Help me distribute protein across the day and prepare a week of meals without repetitive guesswork.”

### Persona C — Healthy-eating user

Does not necessarily want to lose weight but wants more protein and better meal organisation.

**Job:** “Give me balanced, easy-to-cook meal ideas and one shopping list for the week.”

## 5. Core user journeys

### Journey 1 — First-time setup

1. User opens the app.
2. User selects a goal: fat loss while maintaining muscle, muscle gain, or higher-protein healthy eating.
3. User enters optional profile information needed for estimates, such as age, height, weight, and activity level. Explain why each field is requested.
4. User sets or reviews suggested calorie and protein targets.
5. User chooses dietary preferences, allergies/intolerances, excluded ingredients, cooking skill, budget preference, and preferred number of meals/snacks.
6. User sees a clear summary and can edit targets before saving.

**Requirement:** Never force the user to provide sensitive profile information if they prefer to enter targets manually.

### Journey 2 — Discover a recipe

1. User opens Recipes.
2. User browses photo-led recipe cards.
3. User filters by meal type, protein minimum, calorie maximum, preparation time, dietary preference, and ingredients to exclude.
4. User opens a recipe detail page.
5. User sees photo, description, ingredients, instructions, servings, preparation/cooking time, calories, protein, carbohydrates, and fat per serving.
6. User adds the recipe to a selected day and meal slot or saves it as a favourite.

### Journey 3 — Build a weekly plan

1. User opens Meal Plan.
2. User chooses a week.
3. User adds recipes to breakfast, lunch, dinner, and one or more snack slots.
4. User sees daily calories and protein update immediately.
5. User can swap a meal, duplicate a meal, change servings, or leave a slot empty.
6. User can use a suggested plan as a starting point, then edit it.

### Journey 4 — Find high-protein snacks

1. User opens Snacks or applies the snack filter in Recipes.
2. User chooses a calorie ceiling and protein minimum.
3. User sees photo-led snack cards with calories, protein, and preparation time.
4. User adds a snack to a day or saves it.

Default example filter values may be offered as presets, but users must be able to change them. Do not hard-code one definition of “low calorie” for all users.

### Journey 5 — Generate a shopping list

1. User selects a date range or planned week.
2. User taps Generate shopping list.
3. App aggregates recipe ingredients and quantities across the plan.
4. User sees grouped categories (e.g. fruit and vegetables, dairy, meat/fish, pantry, other).
5. User can check items off, edit quantities, remove items, or add manual items.
6. Regenerating the list updates plan-derived items while preserving checked state where item identity remains stable, and preserves manual items.

## 6. Functional requirements

Priorities: **P0 = required for MVP**, **P1 = important follow-up**, **P2 = later enhancement**.

### 6.1 Account and preferences

- **P0** Guest mode or account sign-in; choose the simplest secure implementation.
- **P0** Persist user settings and meal plans.
- **P0** Allow users to edit or clear their profile and targets.
- **P0** Dietary preferences and ingredient exclusions.
- **P1** Export user data and account deletion flow.
- **P1** Multiple household members.

### 6.2 Nutrition goals

- **P0** Daily calorie target (kcal).
- **P0** Daily protein target (g).
- **P1** Optional carbohydrate and fat targets (g).
- **P0** Manual target entry.
- **P1** Suggested targets based on user-provided details, with clear explanation and disclaimer.
- **P0** Daily progress display showing consumed/planned amount and remaining amount.
- **P0** Do not shame users or use punitive language when targets are exceeded or missed.

### 6.3 Recipe catalogue

- **P0** Photo-led recipe grid/list.
- **P0** Recipe detail view.
- **P0** Per-serving nutrition: kcal, protein, carbohydrates, fat.
- **P0** Ingredients with quantities and units.
- **P0** Preparation time and cooking time.
- **P0** Step-by-step instructions.
- **P0** Search by recipe name and ingredient.
- **P0** Filters for meal type, calorie maximum, protein minimum, time, and excluded ingredients.
- **P0** Snack category.
- **P1** Favourites and recently viewed recipes.
- **P1** Serving-size adjustment.
- **P1** Recipe import, only from sources where terms and permissions allow it.

### 6.4 Meal planner

- **P0** Day and week views.
- **P0** Meal slots: breakfast, lunch, dinner, snack.
- **P0** Multiple snack entries per day.
- **P0** Add, remove, replace, duplicate, and reorder planned meals.
- **P0** Change recipe servings.
- **P0** Recalculate daily and weekly nutrition totals after every change.
- **P0** Show empty slots and allow them to remain empty.
- **P1** Generate a suggested week from goals and preferences.
- **P1** Copy a previous day or week.

### 6.5 Shopping list

- **P0** Generate from a selected plan date range.
- **P0** Aggregate matching ingredients and compatible units.
- **P0** Group by category.
- **P0** Check/uncheck items.
- **P0** Edit quantity and unit.
- **P0** Add and remove manual items.
- **P0** Preserve manual items and checked state when regenerating where possible.
- **P1** Pantry inventory and subtract-on-hand quantities.
- **P1** Share/export list.
- **P2** Supermarket-specific product matching and prices, subject to provider availability and terms.

### 6.6 PWA and offline

- **P0** Valid web app manifest with app name, icons, theme/background colours, and `display: standalone`.
- **P0** HTTPS in production.
- **P0** Service worker and installability checks.
- **P0** Responsive layouts.
- **P0** Cache app shell and recently viewed/saved recipe content where appropriate.
- **P0** Clearly indicate offline status.
- **P0** Queue or locally persist safe user edits while offline and sync when connection returns.
- **P1** Conflict handling when the same plan is edited on multiple devices.
- **P0** Do not cache private user data in a way that exposes it to another user on a shared device.

## 7. Information architecture and suggested routes

- `/` — Today dashboard
- `/onboarding` — Goal and preference setup
- `/recipes` — Recipe discovery and filters
- `/recipes/[slug]` — Recipe details
- `/snacks` — High-protein snack discovery
- `/planner` — Weekly meal planner
- `/shopping-list` — Consolidated grocery list
- `/settings/goals` — Nutrition targets
- `/settings/preferences` — Dietary preferences and exclusions
- `/settings/account` — Account and data controls

Primary mobile navigation: Today, Plan, Recipes, Shopping. Snacks can be a prominent recipe filter or dedicated route.

## 8. Key screens and UI requirements

### Today dashboard

- Date and friendly greeting.
- Daily calorie and protein progress.
- Planned meal cards, including snacks.
- Quick actions: add meal, find snack, view shopping list.
- Clear empty state for users with no plan.

### Recipe card

- Image with appropriate aspect ratio and fallback.
- Recipe name.
- Protein and calories per serving.
- Prep time.
- Small tags such as “High protein” or “Snack”.
- Do not show a “low calorie” label unless it meets a transparent filter/threshold.

### Recipe detail

- Large hero image.
- Serving controls.
- Macro summary.
- Ingredients and instructions.
- Add to plan action.
- Save/favourite action.
- Source and nutrition-data attribution if applicable.

### Planner

- Week navigation.
- Day columns or mobile day tabs.
- Meal slots with clear snack support.
- Daily protein and calorie summary.
- Add/swap controls.
- Avoid requiring horizontal scrolling on narrow screens.

### Shopping list

- Date range selector.
- Ingredient categories.
- Quantity and unit.
- Checkboxes with accessible labels.
- Manual add item.
- Regenerate list action with clear explanation.

## 9. Data model — conceptual

Suggested entities; adapt to the selected persistence layer.

### UserProfile
- `id`
- `display_name` (optional)
- `locale`
- `unit_system` (`metric` by default)
- `timezone`
- `created_at`, `updated_at`

### NutritionGoal
- `id`
- `user_id`
- `daily_calorie_target_kcal`
- `daily_protein_target_g`
- `daily_carbs_target_g` (nullable)
- `daily_fat_target_g` (nullable)
- `goal_type`
- `effective_from`
- `created_at`, `updated_at`

### UserPreference
- `user_id`
- `dietary_patterns[]`
- `allergens[]`
- `excluded_ingredients[]`
- `preferred_cuisines[]`
- `max_prep_minutes` (nullable)
- `budget_preference` (nullable)

### Recipe
- `id`
- `slug`
- `name`
- `description`
- `image_url`
- `image_alt`
- `image_attribution` (nullable)
- `image_license` (nullable)
- `meal_types[]`
- `ingredients[]` or normalized recipe ingredient records
- `instructions[]`
- `servings`
- `prep_minutes`
- `cook_minutes`
- `nutrition_per_serving` (kcal, protein_g, carbs_g, fat_g)
- `nutrition_source`
- `nutrition_is_estimated`
- `tags[]`
- `created_at`, `updated_at`

### PlannedMeal
- `id`
- `user_id`
- `recipe_id` (nullable for custom meal)
- `date`
- `meal_type`
- `servings`
- `position`
- `custom_name` (nullable)
- `custom_nutrition` (nullable)
- `created_at`, `updated_at`

### ShoppingList / ShoppingListItem
- list owner and date range
- item name and canonical ingredient key
- quantity and unit
- category
- source planned meal/recipe references
- checked state
- manual-vs-generated origin
- stable identity key for regeneration

### Favourite
- `user_id`
- `recipe_id`
- `created_at`

## 10. Business logic and acceptance criteria

### Nutrition calculations

- Recipe totals are calculated from per-serving values multiplied by planned servings.
- Daily totals are the sum of all planned meals on that date, including snacks.
- Weekly totals and averages must use only the selected date range.
- Display remaining values as target minus planned total; negative remaining values are allowed and should be labelled neutrally.
- Round display values consistently; preserve full precision internally where practical.

### Shopping aggregation

- Given two planned recipes containing the same ingredient in compatible units, the generated list contains one combined line.
- Given incompatible units, keep separate lines unless a safe conversion exists.
- Changing servings updates generated quantities.
- Removing a planned meal removes its generated ingredient contribution.
- Manual items are not deleted when the list is regenerated.
- Checked items remain checked if the same stable ingredient item remains after regeneration.

### Recipe filtering

- Protein minimum and calorie maximum apply to per-serving nutrition.
- Excluded ingredients must remove matching recipes from results.
- Filters can be combined.
- Empty results provide a useful reset-filters action.

### Example acceptance scenario

Given a user has a 1,900 kcal target and 150 g protein target, and plans:
- Breakfast: 400 kcal, 35 g protein
- Lunch: 550 kcal, 45 g protein
- Dinner: 600 kcal, 50 g protein
- Snack 1: 150 kcal, 20 g protein

Then the day summary shows 1,700 kcal and 150 g protein, with 200 kcal remaining and 0 g protein remaining. These are planning figures, not a judgement or medical assessment.

## 11. Non-functional requirements

- Mobile-first; support current evergreen Chrome, Safari, and Edge.
- Target WCAG 2.2 AA for core flows.
- Fast initial render; optimize image sizes and use responsive images.
- Avoid layout shifts from recipe imagery.
- Secure authentication and row-level authorization if a hosted backend is used.
- Validate all server actions and API inputs.
- Provide useful error messages without leaking internal errors.
- Keep analytics privacy-conscious and consent-aware where required.
- Support localization; initial default can be English with architecture ready for Lithuanian.
- Use metric units by default and EUR for optional price displays.
- Respect GDPR principles: data minimisation, transparency, deletion/export capability, and appropriate consent.

## 12. Content and safety requirements

- Nutrition values must have a source and an estimated/verified flag.
- Recipe photos and text must be original, licensed, or used with permission.
- Do not market the app as providing medical advice.
- Do not encourage extreme calorie restriction, rapid weight loss, or punitive food behaviour.
- Provide a brief disclaimer around personalised targets.
- Allergens should be clearly surfaced when known; do not guarantee allergen-free status unless the data supports it.
- Users with medical dietary needs should be directed to a qualified health professional.

## 13. Analytics and success metrics

Track only events needed to evaluate product usefulness, with appropriate privacy controls.

Potential events:
- onboarding_completed
- nutrition_goal_saved
- recipe_viewed
- recipe_added_to_plan
- recipe_swapped
- snack_filter_used
- shopping_list_generated
- shopping_item_checked
- plan_week_completed

MVP success indicators:
- Users complete onboarding and set targets.
- Users add recipes across multiple meal types, including snacks.
- Users generate a shopping list from a plan.
- Users return to edit their plan in a later session.
- Users report that meal planning and shopping take less effort.

Do not define success solely by weight loss or calorie restriction.

## 14. Release plan

### MVP
- Onboarding and manual targets
- Seed recipe catalogue with licensed images
- Recipe discovery and detail
- Weekly planner with snacks
- Nutrition summaries
- Shopping list generation and editing
- PWA installability and basic offline support

### V1
- Suggested meal-plan generation
- Lithuanian localization
- Favourites and pantry
- Export/share shopping list
- Better offline synchronization

### Later
- Optional supermarket integrations
- Price comparisons where reliable data access exists
- Recipe import where permitted
- Household plans
- Fitness tracker integrations

## 15. Open product decisions

Resolve these before implementing the relevant feature; use the defaults below if no stakeholder decision is available:

1. **Authentication:** default to guest-first with optional account sync.
2. **Recipe content:** start with a curated seed catalogue; do not depend on scraping.
3. **Meal generation:** MVP supports manual planning; add rule-based suggestions in V1.
4. **Localization:** English first, with translation-ready strings and metric/EUR defaults.
5. **Nutrition targets:** allow manual entry; any suggested targets must be transparent estimates.
6. **Pricing:** no paid subscription in MVP unless explicitly requested.
