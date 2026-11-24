# ROADMAP.md — Protein Plate Development Phases

This roadmap turns `PRD.md` and the implementation order in `AGENTS.md` into checkable tasks. Phases 0–8 make up the MVP. V1 and Later follow the release plan in `PRD.md` §14.

Every task must meet the **Definition of done** in `AGENTS.md`: responsive at mobile and desktop widths, accessible, loading/empty/error/offline states handled, tests for business logic, docs updated, and lint/typecheck/tests/build run.

**Legend:** `[ ]` not started · `[x]` done · **P0/P1/P2** = PRD priority

---

## Phase 0 — Project foundation

- [x] Scaffold Next.js (App Router) with TypeScript strict mode, Tailwind CSS, and ESLint
- [x] Choose and commit to a package manager; commit the lockfile
- [x] Add scripts: `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`
- [x] Set up Vitest for unit tests
- [x] Set up Playwright for end-to-end tests
- [x] Add Zod; create `lib/validation/` for shared schemas
- [x] Create the folder structure from `README.md` (`app/`, `components/`, `lib/`, `data/`, `public/`, `tests/`)
- [x] Add `.env.example` with safe placeholders only; make sure `.env.local` is git-ignored
- [x] Set up translation-ready strings (English first, ready for Lithuanian)
- [x] Add CI to run lint, typecheck, unit tests, and build on every push/PR
- [ ] Pick a `LICENSE` before any public distribution
- [x] Update the README "Project status" and "Getting started" sections to match the real setup

## Phase 1 — App shell, design tokens, and PWA foundation

- [ ] Define design tokens: colours, type scale, spacing, radii, shadows (warm, food-focused, non-clinical)
- [ ] Check token colour pairs against WCAG 2.2 AA contrast
- [ ] Build base components: Button, Card, Chip/Tag, Input, Select, Checkbox, Dialog/Sheet, Tabs, Toast
- [ ] Add a visible focus style and respect `prefers-reduced-motion`
- [ ] Build the responsive layout: bottom nav on mobile (Today, Plan, Recipes, Shopping), sidebar/top nav on desktop
- [ ] Add a persistent path to Profile/Goals
- [ ] Add semantic landmarks, a skip link, and correct heading order in the shell
- [ ] Create placeholder routes: `/`, `/onboarding`, `/recipes`, `/recipes/[slug]`, `/snacks`, `/planner`, `/shopping-list`, `/settings/goals`, `/settings/preferences`, `/settings/account`
- [ ] Add global error, not-found, and loading boundaries
- [ ] Add a web app manifest: name, short name, icons (incl. maskable), theme/background colours, `display: standalone`
- [ ] Create app icons at the required sizes
- [ ] Register a service worker that caches the app shell and static assets
- [ ] Add an offline indicator component
- [ ] Verify installability in Chrome/Edge (Lighthouse) and with "Add to Home Screen" on iOS Safari

## Phase 2 — Onboarding and nutrition goals

- [ ] Define domain types and Zod schemas for `NutritionGoal` and `UserPreference`
- [ ] Onboarding step: pick a goal (fat loss while keeping muscle, muscle gain, higher-protein healthy eating)
- [ ] Onboarding step: optional profile details (age, height, weight, activity), each with a short "why we ask" note
- [ ] Let users skip profile details and enter targets by hand (P0)
- [ ] Manual entry of daily calorie (kcal) and protein (g) targets (P0)
- [ ] Optional carbohydrate and fat targets (P1)
- [ ] Onboarding step: dietary preferences, allergens/intolerances, excluded ingredients, cooking skill, budget, number of meals/snacks
- [ ] Summary step with editable targets before saving
- [ ] Show the disclaimer: targets are estimates, not medical advice; see a professional for medical needs, pregnancy, or eating-disorder history
- [ ] `/settings/goals`: edit or clear targets
- [ ] `/settings/preferences`: edit preferences and exclusions
- [ ] Clear validation messages for every field
- [ ] Unit tests for goal and preference schemas

## Phase 3 — Recipe catalogue, detail, search, and filters

- [ ] Define the `Recipe` type and Zod schema (nutrition per serving, servings, times, meal types, allergens, image metadata, `nutrition_source`, `nutrition_is_estimated`)
- [ ] Create a curated ingredient alias map and category list for shopping aggregation
- [ ] Write seed recipes: breakfasts, lunches, dinners, several high-protein snacks, vegetarian options, quick and batch-cook dishes
- [ ] Get licensed, owned, or permitted images only; record attribution and licence for each
- [ ] Validate all seed data against the schema in a test
- [ ] Recipe card: image with fixed aspect ratio and placeholder, name, kcal and protein per serving, prep time, tags
- [ ] Only show a "low calorie" tag when it meets a stated threshold
- [ ] `/recipes`: photo-led grid/list
- [ ] Text search by recipe name and ingredient
- [ ] Filters: meal type, protein minimum, calorie maximum, prep-time maximum, dietary pattern, excluded ingredients/allergens
- [ ] Filters are composable, deterministic, and use inclusive boundaries
- [ ] Apply the user's saved exclusions by default, with a way to see them
- [ ] Empty results state with a reset-filters action
- [ ] `/recipes/[slug]`: hero image, description, servings, prep/cook time, macro summary, ingredients, steps, allergens, source and nutrition attribution, estimated/verified label
- [ ] `/snacks`: snack discovery with editable calorie/protein presets
- [ ] Responsive images with no layout shift
- [ ] Unit tests: each filter, combined filters, boundary values, zero results, exclusions

## Phase 4 — Meal planner

- [ ] Define `PlannedMeal` type and schema (recipe or custom, date, meal type, servings, position)
- [ ] Decide date storage format and timezone handling; document it
- [ ] Domain functions for add, remove, replace, duplicate, reorder, and change servings
- [ ] `/planner` week view with week navigation
- [ ] Mobile day tabs with no horizontal scrolling on narrow screens
- [ ] Day view with breakfast, lunch, dinner, and snack slots
- [ ] Support multiple snacks per day
- [ ] Empty slots are shown and can stay empty
- [ ] Add-to-plan flow from recipe detail and recipe cards (pick date, meal type, servings)
- [ ] Swap flow showing how the swap changes the day's totals
- [ ] Custom meals with user-entered nutrition, clearly marked as not a verified recipe
- [ ] Confirm before bulk destructive actions (e.g. clear day/week)
- [ ] Plan edits survive navigation and page refresh
- [ ] Unit tests for every planner operation

## Phase 5 — Nutrition summaries and target progress

- [ ] Pure functions: scale per-serving nutrition by servings; sum meal, day, and range totals
- [ ] Treat missing nutrition as unknown, not zero, and show that in the UI
- [ ] Remaining = target − planned; negative values labelled neutrally
- [ ] Round only for display; keep full precision internally
- [ ] Weekly totals and averages use only the selected date range
- [ ] Per-meal nutrition chips in the planner and Today views
- [ ] Daily calorie and protein progress in the planner
- [ ] Progress status uses text/icons as well as colour; no shaming language or red warnings for ordinary differences
- [ ] Announce total changes to screen readers without excess chatter
- [ ] Today dashboard (`/`): date, greeting, calorie/protein progress, planned meals incl. snacks, quick actions, empty state
- [ ] Unit tests: one serving, fractional servings, multiple meals, multiple snacks, empty day, missing values, negative values rejected, target above/equal/below
- [ ] Unit test for the PRD example scenario (1,700 kcal / 150 g, 200 kcal and 0 g remaining)

## Phase 6 — Shopping list

- [ ] Define `ShoppingList` and `ShoppingListItem` types (canonical key, quantity, unit, category, sources, checked, origin, stable identity key)
- [ ] Aggregation: collect ingredients in range → scale by servings → normalise via alias map → combine compatible units only → categorise → attach sources
- [ ] Never convert volume to mass without an ingredient-specific conversion
- [ ] Generation is deterministic for a given plan
- [ ] Regeneration keeps manual items and keeps checked state for stable items
- [ ] `/shopping-list`: date range selector and Generate action with a short explanation
- [ ] Compact rows grouped by category
- [ ] Accessible checkboxes to check/uncheck items
- [ ] Edit quantity and unit; remove items
- [ ] Add and remove manual items
- [ ] Empty state when the plan has no meals
- [ ] Unit tests: same ingredient/unit, aliases, different units, fractional quantities, changed servings, removed recipe, manual items, checked-state preservation, empty plan

## Phase 7 — Persistence, offline, and accessibility

- [ ] Guest-first local persistence for goals, preferences, plans, and shopping lists
- [ ] Validate persisted data with schemas on load; add a versioned migration path for local data
- [ ] Decide whether to add optional account sync (Supabase) now or in V1; document the decision
- [ ] If Supabase is added: auth, schema, row-level security, additive migrations, env vars in `.env.example`
- [ ] Cache recently viewed and saved recipes according to freshness and licence rules
- [ ] Save edits locally while offline; sync with retry and backoff when back online
- [ ] Clearly tell users which actions need a connection
- [ ] Make sure private data is not exposed to other users on a shared device (e.g. clear on sign-out)
- [ ] Document what works offline; don't claim full offline support if only the shell is cached
- [ ] Keyboard-only pass through all core flows
- [ ] Screen-reader pass (VoiceOver and NVDA or TalkBack)
- [ ] Automated accessibility scans (e.g. axe in Playwright)
- [ ] Touch target and contrast checks
- [ ] E2E test: onboarding → plan meals → add snack → generate shopping list
- [ ] E2E tests: offline shell, offline edit then sync

## Phase 8 — Polish and launch readiness

- [ ] Visual polish pass on all screens at narrow mobile and desktop widths
- [ ] Image optimisation and performance check (Lighthouse)
- [ ] Analytics consent banner, only if analytics is added
- [ ] Privacy-conscious analytics for the PRD events (`onboarding_completed`, `recipe_added_to_plan`, `shopping_list_generated`, etc.)
- [ ] Privacy notice and GDPR basics: data minimisation and transparency
- [ ] Data export and account/data deletion (P1, required before public launch)
- [ ] Content review: all nutrition has a source and estimated/verified flag; all images have a licence
- [ ] Safety copy review: no medical claims, no extreme restriction, no weight-loss guarantees
- [ ] Production deployment over HTTPS
- [ ] Final README, setup, and route docs update

---

## V1 — After MVP validation

- [ ] Favourites and recently viewed recipes
- [ ] Serving-size adjustment on recipe detail
- [ ] Suggested targets from profile details, with clear explanation and disclaimer
- [ ] Rule-based suggested week from goals and preferences
- [ ] Copy a previous day or week
- [ ] Lithuanian localisation
- [ ] Pantry inventory and subtract-on-hand quantities
- [ ] Share/export shopping list
- [ ] Better offline sync and conflict handling across devices
- [ ] Multiple household members

## Later

- [ ] Recipe import, only where terms and permissions allow
- [ ] Optional supermarket product matching and EUR prices, subject to provider terms
- [ ] Price comparisons where reliable data exists
- [ ] Household plans
- [ ] Fitness tracker integrations

## Out of scope for MVP

Social feeds, coaching chat, AI dietitian, barcode scanning, supermarket checkout, medical features, wearables, and full micronutrient analysis (see `PRD.md` §3 and `AGENTS.md`).
