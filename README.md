# Protein Plate — High-Protein Meal Planner PWA

A mobile-first Progressive Web App concept for planning a high-protein diet, discovering photo-led recipes and snacks, tracking calories and macros, and generating a consolidated grocery list.

> Product requirements and agent instructions are in `PRD.md`, `AGENTS.md`, and `SKILLS.md`.

## Product scope

The MVP is intended to help users:

- Set a daily calorie and protein target.
- Discover recipes with photos and per-serving nutrition.
- Find high-protein, lower-calorie snack ideas.
- Plan breakfast, lunch, dinner, and multiple snacks.
- See daily and weekly calorie/protein totals.
- Generate and edit a shopping list from planned meals.
- Install the app on a phone and use core features with basic offline support.

This is a meal-planning tool, not medical advice.

## Project status

**MVP complete (Phases 0–8); not yet deployed.** Users can set goals, browse 25 original recipes, plan a week with progress against their targets, and create a shopping list. Everything works offline and stays on their device, with export, import, and delete-everything in Settings → Account. Phase 8 added a privacy notice, security headers and CSP, a visual polish pass, Lighthouse tuning, and automated content and safety-copy reviews. Nutrition values come from USDA FoodData Central, and recipes use illustrations until licensed photos are added (decision 0003). **Before a public launch:** see [docs/launch-checklist.md](docs/launch-checklist.md) or run `npm run launch:check` (operator details, dietitian sign-off, deployment with real-device testing, and a screen-reader pass). See `ROADMAP.md` for progress and next phases.

## Tech stack

- Next.js 16 (App Router, Turbopack, Cache Components enabled)
- React 19
- TypeScript (strict, plus `noUncheckedIndexedAccess`)
- Tailwind CSS 4
- Zod 4 for validation
- Vitest + React Testing Library for unit/component tests
- Playwright for end-to-end tests
- npm (lockfile committed), Node.js 24 or newer (see `.nvmrc`)

Not yet added: Supabase (Phase 7). React Hook Form was considered for onboarding but not needed (see Forms). UI components are hand-written in `components/ui/` rather than pulled from a library.

> Next.js 16 differs from older versions. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/`.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` (Next.js picks another port if 3000 is in use; check the terminal output).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run test` | Unit and component tests (Vitest, single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Builds, serves on port 3210, runs Playwright (Chromium, WebKit, and Firefox at phone and desktop sizes) |
| `npm run icons` | Regenerate PNG icons and favicons from `assets/*.svg` (commit the output) |
| `npm run check` | Lint, typecheck, unit tests, and build in sequence |
| `npm run launch:check` | Lists what still blocks a public launch; exits with 1 until nothing does |

Before the first e2e run, install the browsers: `npx playwright install chromium webkit firefox`. WebKit needs extra system libraries (`npx playwright install-deps webkit`, which needs admin rights); without them, run the other engines with `--project=desktop-chromium --project=mobile-chromium --project=desktop-firefox`. If port 3210 is taken, set `E2E_PORT`. The e2e run will not reuse a server that is already running on that port.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build, and e2e in all three engines on every push and pull request, plus `launch:check` as an informational job. It doesn't deploy.

## Environment variables

No environment variables are required yet. `.env.example` lists the planned optional Supabase variables (Phase 7) as commented placeholders. To use them later, copy the file to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never place a service-role key or other secret in a `NEXT_PUBLIC_` variable. Add any server-only secrets without the `NEXT_PUBLIC_` prefix. `.env*` files are git-ignored, except `.env.example`.

Until a hosted backend is configured, the MVP uses local persistence and guest mode.

## Application structure

```text
app/                 Routes (App Router), manifest.ts, icon.svg, apple-icon.png
  error.tsx, global-error.tsx, not-found.tsx, loading.tsx   Route boundaries
components/
  ui/                Base components: Button, Card, Tag, TextField/SelectField/Checkbox,
                     Dialog (native <dialog>, optional bottom-sheet), Tabs, Toast, Icon
  layout/            App shell, navigation, page header, offline banner
  pwa/               Service worker registration
  onboarding/        Set-up wizard and summaries
  goals/             Goal type, targets, estimate, and Goals settings
  preferences/       Preference fields and Preferences settings
  settings/          Loading / unreadable-data gate for saved settings
  today/             Today dashboard
  nutrition/         Progress panel, per-meal nutrition chips
  forms/             Field error messages and focus helpers
  recipes/           Recipe card, image/placeholder, browser and filters, detail page
  planner/           Week view, day tabs, slots, meal rows, add/swap/duplicate sheets,
                     Add to plan button, servings stepper
  storage/           Loading / unreadable-data gate shared by settings, plan, and list
  shopping/          Shopping list view, item rows, item fields, date-range picker
lib/                 Domain logic, kept free of UI code
  i18n/              Translation-ready UI strings (English; Lithuanian-ready)
  validation/        Shared Zod primitives (amounts, servings, dates, slugs)
  forms/             Numeric input parsing and field error codes
  nutrition/         Goal schema and target parsing (goal.ts), estimate (estimate.ts),
                     planned-meal, day, and range totals (totals.ts), target progress (progress.ts)
  preferences/       Preference schema, allergens, excluded-ingredient helpers
  settings/          Saved settings document and the useSettings hook
  storage/           Schema-validated localStorage document and useLocalDocument hook
  planner/           Plan schema, pure plan operations, saved plan document, custom-meal form
  shopping/          List schema, aggregation, list operations, formatting, date ranges
  dates.ts           Calendar-date helpers (weeks start Monday)
  ingredients/       Ingredient schema, catalogue, alias index, word matching
  recipes/           Recipe schema, catalogue views, nutrition calculation,
                     labels (tags.ts), filters and sorting, quantity formatting
  navigation.ts      Route table and nav configuration
data/ingredients.ts  Curated ingredient table (nutrition, allergens, aliases, aisle)
data/recipes/        Seed recipes
assets/              Icon source artwork (SVG)
config/operator.ts   Who runs the app (shown in the privacy notice)
scripts/             Icon generation and the launch-readiness check
proxy.ts             Returns a real 404 for unknown recipe slugs
public/sw.js         Service worker
public/icons/        Generated PWA icons
public/images/       Licensed recipe images (none yet; illustrations for now)
tests/unit/          Vitest tests
tests/e2e/           Playwright tests
```

Empty folders contain a `.gitkeep` until they're used.

### Design tokens

Colours, radii, shadows, and fonts are defined once in `app/globals.css` (`@theme`) and used as Tailwind utilities (`bg-canvas`, `text-ink-muted`, `bg-primary`, `rounded-card`, `font-display`, …). `tests/unit/design/tokens.test.ts` reads that file and checks every text and control colour pair against WCAG 2.2 AA. Add a pair to the test whenever you combine colours in a new way.

Conventions: one global `:focus-visible` outline; interactive elements are at least 44×44 px; `prefers-reduced-motion` disables animation; status is never shown by colour alone. Light theme only for now.

### Forms

Forms are hand-written with small helpers rather than a form library. Validation lives in `lib/` as pure functions that return error codes (`required`, `notANumber`, `outOfRange`, …); `components/forms/field-error.ts` turns codes into translated messages, and the first invalid field receives focus. Numeric inputs are text inputs with `inputMode`, so EU decimal commas (`72,5`) and grouped thousands (`1,900`, `1 900`) are accepted. Values are validated again with Zod before they are saved.

**Next.js keeps recently visited pages mounted.** With Cache Components, up to three routes stay alive (hidden with React `<Activity>`) with their state. Forms that edit saved data are keyed by that data, so they re-initialise if it changes elsewhere, and the onboarding wizard resets after a successful save. In e2e tests, prefer role queries (`getByRole`), which ignore hidden pages, over `getByLabel`/`getByText`.

### Strings and locales

UI text lives in `lib/i18n/messages/en.ts`; components read it with `getMessages()`. To add Lithuanian, create `messages/lt.ts` typed as `Messages`, then add `"lt"` to `locales` in `lib/i18n/index.ts`. A missing key is a type error.

## Main routes

| Route | Purpose |
|---|---|
| `/` | Today dashboard and nutrition progress |
| `/onboarding` | Goals and food preferences |
| `/recipes` | Recipe discovery and filters |
| `/recipes/[slug]` | Recipe details |
| `/snacks` | High-protein snack discovery |
| `/planner` | Weekly meal plan |
| `/shopping-list` | Consolidated grocery list |
| `/settings/goals` | Calorie and macro targets |
| `/settings/preferences` | Dietary preferences and exclusions |
| `/settings/account` | What's saved on this device; download, restore, or delete it |
| `/privacy` | Privacy notice |
| `/offline` | Shown for pages that aren't available offline |

## Core domain concepts

- **Recipe:** ingredients, instructions, servings, photo metadata, prep time, and nutrition per serving.
- **Nutrition goal:** daily calorie and protein targets, with optional carb and fat targets.
- **Planned meal:** recipe/custom meal, date, meal type, and servings.
- **Meal type:** breakfast, lunch, dinner, or snack. Multiple snacks per day are supported.
- **Shopping list item:** normalized ingredient, quantity, unit, category, checked state, and source references.

Keep nutrition calculations and shopping aggregation in testable domain functions rather than embedding them in UI components.

## Saved data and privacy

Guest mode only; there is no account or server storage yet.

- **Where:** JSON documents in `localStorage`: `protein-plate:settings` (`userSettingsSchema` in `lib/settings/settings.ts`), `protein-plate:plan` (`mealPlanSchema` in `lib/planner/schema.ts`), and `protein-plate:shopping` (`shoppingListSchema` in `lib/shopping/schema.ts`), each with `version: 1`.
- **What:** goal type; daily calorie and protein targets; optional carbohydrate and fat targets; whether the targets started from an estimate; food preferences (eating pattern, the 14 EU-declared allergens, other excluded ingredients, cooking confidence, budget, meals and snacks per day); and when onboarding was completed.
- **What is never saved:** the age, sex, height, weight, and activity level used for estimates. They exist only in component state while the estimate form is open.
- **Validation and versions:** every document has a `version` and is checked against its schema on every read. Older versions are upgraded by migrations (`migrations[n]` upgrades n → n+1) and saved in the new shape on the next write. Damaged data is never trusted: the UI explains and offers a reset. Data saved by a **newer** app version (e.g. another tab already updated) is never reset or overwritten: the UI asks for a reload instead. Writes never replace a document that can't be read. Failed writes (storage blocked or full) show an error and change nothing.
- **Shared devices:** anyone using the same browser can see this data, and the app says so where it saves. **Settings → Account** shows what's stored and deletes everything from the device (it works even if the data can't be read).
- **Export and import:** Settings → Account downloads everything as one JSON file (`lib/storage/backup.ts`) and can restore it in another browser. An imported file goes through the same schemas and migrations as a normal read, and replaces current data only after confirmation.
- **Privacy notice:** `/privacy`, linked from every page's footer. No analytics, cookies, or third-party requests ([decision 0002](docs/decisions/0002-no-analytics-in-mvp.md)); `tests/e2e/security.spec.ts` fails if any page loads anything from another origin.

### Suggested targets

The optional estimate in onboarding and Settings → Goals is a transparent starting point, shown with its full working:

- Resting energy uses the Mifflin–St Jeor formula. "Prefer not to say" uses the midpoint of the female and male constants.
- Maintenance is resting energy × a standard activity factor (1.2–1.9).
- Goal adjustment: −15% for fat loss, +10% for muscle gain, none for eating more protein.
- Protein: 1.8 g/kg for fat loss or muscle gain, 1.4 g/kg otherwise.
- Safety rails: never below 1,200 kcal; protein capped at 35% of calories; ages 18–100 only.

The user always reviews and edits the numbers. Manual targets must be between 800 and 6,000 kcal and 20 and 400 g protein; below 1,200 kcal, a neutral note suggests checking with a professional. A disclaimer is shown wherever targets are set. The logic is in `lib/nutrition/estimate.ts` and is unit-tested against worked examples.

## Meal planner

- **Data model** (`lib/planner/schema.ts`): a plan is a list of planned meals. Each has an id, a date, a meal type (breakfast, lunch, dinner, snack), a position within its date + meal-type slot, servings (¼ to 20 in quarter steps), and either a recipe slug or a custom meal (name plus user-entered nutrition per serving: calories and protein required, carbohydrate and fat optional). Custom meals are always labelled "Your own meal… not a verified recipe".
- **Dates:** stored as local calendar dates (`YYYY-MM-DD`) with no time or timezone, meaning "the user's Thursday". "Today" comes from the device clock. Date arithmetic uses UTC internally, so daylight-saving changes never shift a day. Weeks run Monday to Sunday. Dates display in en-GB style ("Thu 26 Nov"). See `lib/dates.ts`.
- **Operations** (`lib/planner/operations.ts`) are pure functions: add, remove, restore (undo), replace (swap; keeps slot, position, and servings), duplicate, move up/down, set servings, and clear dates. Positions stay contiguous within each slot. They take the clock and id generator as arguments, so tests are deterministic.
- **Totals** (`lib/nutrition/totals.ts`): per-serving values × planned servings, summed at full precision. Unknown is never zero: a meal whose recipe no longer exists has no nutrition and is counted separately ("Plus 1 meal without nutrition information"), and carbohydrate/fat totals are unknown if any meal's are.
- **Saving:** a separate browser document, `protein-plate:plan`, validated on every read. If it can't be read, the planner explains, refuses to overwrite it silently, and offers a reset that leaves goals and preferences untouched.
- **URL:** the selected day is in `?date=YYYY-MM-DD`, so refresh, back/forward, and "View plan" links land on the right day.
- **Bulk actions** (clear day, clear week) ask for confirmation. Removing one meal or swapping offers "Undo" in a toast.

## Shopping list

- **Generation** (`lib/shopping/aggregate.ts`) is pure and deterministic. For the chosen dates (this week, next week, next 7 days, or up to 31 custom days), every planned recipe's ingredients are scaled by *planned servings ÷ recipe servings* and combined by canonical ingredient and unit family:
  - **mass:** g, shown as kg from 1,000 g;
  - **volume:** ml, tsp, and tbsp combine, because a spoon is a fixed volume (5 ml / 15 ml). Lines made only of spoons stay in tsp; otherwise ml, shown as l from 1,000 ml;
  - **pieces:** eggs, lemons, garlic cloves, slices.

  Families are never converted into each other. There is no reliable per-ingredient density data, so grams and millilitres of the same ingredient stay on separate lines. Lines are sorted by aisle, then name, and record which planned meals they came from ("For Ginger chicken stir-fry, …").
- **Not guessed:** custom meals have no ingredient list, and the page says how many were left out. The same goes for planned recipes that no longer exist.
- **Stable identity:** generated lines have ids like `gen:chicken-breast:mass`. **Updating from the plan** recalculates amounts but keeps ticks on lines that still exist, keeps the user's own items, and keeps amounts the user edited (showing "Your plan needs 300 g" beside them). Lines the plan no longer needs are dropped; removed lines come back if the plan still needs them. The page notices when the plan has changed since the list was made and offers an update.
- **Editing:** tick and untick, untick all, edit amount, unit, and aisle (and the name of your own items), remove with Undo, add your own items (sorted into an aisle automatically when the name matches the ingredient catalogue, including aliases such as "Greek yogurt"), and clear the whole list after confirming.
- **Accessibility:** each checkbox is named by its line ("300 g Chicken breast"); which recipes need it, and any notes, are its description. Rows are compact, with 44 px targets.
- **Saved** as a separate browser document, `protein-plate:shopping`, validated on read. An unreadable list is never overwritten silently; resetting it leaves the plan, goals, and preferences alone.

## Nutrition progress

- **Logic** (`lib/nutrition/progress.ts`, `lib/nutrition/totals.ts`) is pure and unit-tested, including the PRD scenario (1,900 kcal / 150 g targets, four meals → 1,700 kcal and 150 g planned, 200 kcal and 0 g remaining).
- **Remaining = target − planned.** Negative values are allowed and worded neutrally ("150 kcal above target"); there is no red, no warning styling, and no "over budget" language. A line reads "Planning figures, not a judgement or medical assessment."
- **Rounding:** values are summed at full precision. For display, planned is rounded once and remaining is derived from that rounded figure, so the two numbers shown always add up to the target.
- **Optional targets:** carbohydrate and fat rows appear only if the user set those targets. If any meal lacks that information, the row says "Unknown" instead of showing a partial number.
- **Weekly summary** (planner) covers exactly the selected Monday–Sunday: the week's total and the daily average over *planned* days (days with nothing planned are left out, and the summary says so).
- **Accessibility:** progress bars are decorative; the text beside each bar carries the meaning. Day totals are announced to screen readers through a polite live region that waits until changes settle (`components/ui/delayed-announcement.tsx`), so repeated servings taps produce one announcement.
- **Without targets,** Today and the planner show planned totals and a link to set targets.

## PWA and offline behaviour

**What works offline** (verified by `tests/e2e/pwa.spec.ts` and `tests/e2e/offline-edit.spec.ts`):

- **Core pages open offline even if you never visited them:** Today, Plan, Recipes, Snacks, Shopping list, set-up, and every Settings page. The service worker precaches them at install, with the build assets their HTML references.
- **Everything you can edit works offline:** goals, preferences, the meal plan, and the shopping list are stored in the browser, so adding meals, changing servings, creating the list, and ticking items all work without a connection and are still there after reloading. There is no server, so there is nothing to sync (see [decision 0001](docs/decisions/0001-guest-first-no-account-sync-in-mvp.md)).
- **Recipe pages** work offline once opened (network-first, so they're fresh when online). Up to 60 are kept, oldest first out. Unvisited recipe pages show a friendly `/offline` page. Recipes are original content, so caching them raises no licensing issue.
- **Moving between pages** while offline works through Next.js's prefetched pages and `experimental.useOffline`. A full reload is served from the cache.
- **The offline banner** says what still works: "Your plan, shopping list, and settings are saved on this device… Recipe pages you haven't opened yet will load when you reconnect."

**Service worker** (`public/sw.js`, production builds only): pages are network-first with a cache fallback; hashed `/_next/static/` assets are cache-first; icons are stale-while-revalidate. It never caches non-GET requests, `/api/*`, other origins, or React Server Component and prefetch requests. Bump `VERSION` when caching rules or the precache list change; old caches are deleted when the new worker activates. Personal data is never in these caches: every page is the same public HTML for everyone.

**Installable:** web app manifest with 192/512 px and maskable icons, theme colours, `display: standalone`, and shortcuts. Chrome's installability check passes in e2e. It hasn't been tested on real iOS or Android devices yet, and production must be served over HTTPS.

To test locally, use a production build (`npm run build && npm run start`); the worker isn't registered in `npm run dev`.

## Security and performance

- **Headers** (`next.config.ts`): Content Security Policy in production (everything from this origin only; no framing), HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. Checked by `tests/e2e/security.spec.ts`.
- **Lighthouse** (mobile, simulated slow 4G): Accessibility, Best Practices, and SEO 100 on every page; CLS 0; Performance 88–100. Details and follow-ups: [docs/performance.md](docs/performance.md).
- **Deployment:** [docs/deployment.md](docs/deployment.md). HTTPS is required; no environment variables are needed.

## Accessibility

Automated: axe scans (WCAG 2.2 A/AA) on every route and key state, contrast tests for design tokens, keyboard-only flows, focus management, and 44 px touch targets. See [docs/accessibility.md](docs/accessibility.md) for coverage and the **manual screen-reader checklist**, which has not been run yet.

## Recipe content and images

Use only original, licensed, or explicitly permitted recipe content and photography. Store attribution and licence metadata where required. Do not scrape recipe sites or images without permission. Provide image alt text and a graceful placeholder for missing images.

### Recipe catalogue

- **Recipes** (`data/recipes/index.ts`) are original recipes written for Protein Plate: 6 breakfasts, 5 lunches, 7 dinners, and 7 snacks (some recipes cover more than one meal), including vegan, vegetarian, fish, and meat dishes, quick ones, and batch-cook ones. They are validated against `recipeSchema` at build time; invalid data fails the build.
- **Ingredients** (`data/ingredients.ts`) are a curated table. Each has a canonical key (used later for shopping-list aggregation), aliases (for search and exclusions, e.g. "zucchini" → courgettes, "shrimp" → prawns), an aisle category, allergens (the 14 EU-declared allergens), what it is made from (plant, dairy, fish…), and nutrition per 100 g with its USDA FoodData Central source.
- **Derived, not typed in:** a recipe's allergens and its vegan/vegetarian/pescatarian suitability are computed from its ingredients, so they can't contradict the ingredient list.
- **Nutrition** per serving is calculated from the ingredient table and stored explicitly in each recipe, labelled *estimated* with its source. `tests/unit/lib/recipe-data.test.ts` fails if a stored value drifts from the calculation. Per-100 g values come from USDA FoodData Central: SR Legacy, or Branded label data for skyr, quark, and light coconut milk. Each ingredient cites its FDC IDs, and the schema refuses nutrition without a source (`docs/nutrition-sources.md`). Carbohydrate is "by difference" and includes fibre, and cooking losses aren't modelled, so values stay labelled *estimated*.
- **Labels** have stated thresholds, shown on each recipe page: *High protein* = at least 20% of energy from protein (the EU condition for the claim); *Under 200 kcal* (snacks) and *Under 450 kcal* (meals) per serving; *Quick* = 15 minutes or less in total; *Batch cook* = marked by the author. Nothing is labelled "low calorie".
- **Photos:** none yet; launching with illustrations is decision 0003. `image` is `null` and a designed, decorative illustration (tinted by meal type) fills the same 4:3 frame. The schema requires `alt`, `attribution`, and `licence` for any photo added later, and the source section of each recipe page shows them. Recipe text is English only for now.

### Searching and filtering

Filters are pure functions in `lib/recipes/filter.ts`. They can be combined, are deterministic (ties are broken by name), and use inclusive bounds on per-serving values. Search needs every word to appear in the recipe name or an ingredient name or alias. Ingredient exclusions match whole words, singular or plural, so "tomato" excludes cherry and canned tomatoes. Saved preferences (eating pattern, allergens, excluded ingredients) are applied by default, shown above the results, and can be switched off. `/snacks` offers presets (up to 150/200/250 kcal with at least 15/20/25 g protein) that are never applied automatically and stay editable.

Unknown recipe URLs return a real `404`. With Cache Components the page shell would otherwise be streamed with a `200` before `notFound()` runs, so `proxy.ts` checks the slug first, following the Next.js guidance.

## Nutrition and safety

- Display nutrition per serving and label estimated values.
- Use kcal and grams by default.
- Allow users to enter their own targets.
- Any suggested targets must be presented as estimates, not prescriptions.
- Do not encourage extreme restriction or make weight-loss guarantees.
- Surface known allergens and avoid guaranteeing allergen-free recipes unless supported by reliable data.
- Users with medical nutrition needs should consult a qualified professional.

## Development workflow

1. Read `AGENTS.md` before making changes.
2. Use `PRD.md` as the product acceptance reference.
3. Follow the workflows in `SKILLS.md`.
4. Inspect existing code and conventions before implementing.
5. Implement the smallest complete vertical slice.
6. Add tests for nutrition and shopping-list business logic.
7. Run checks before handing off.

Run `npm run check` (and `npm run test:e2e` for UI flows) before handing off.

## MVP implementation sequence

1. Responsive app shell and PWA foundation.
2. Onboarding and editable nutrition goals.
3. Recipe catalogue, filters, and recipe detail.
4. Weekly planner with multiple snack slots.
5. Daily nutrition summaries and serving adjustment.
6. Shopping-list generation, aggregation, and editing.
7. Persistence, offline states, accessibility, and polish.

## Documentation map

- `AGENTS.md` — instructions and guardrails for coding agents.
- `PRD.md` — product vision, requirements, flows, acceptance criteria, and release scope.
- `SKILLS.md` — repeatable agent workflows for design, implementation, testing, and handoff.
- `ROADMAP.md` — development phases with checkbox task lists for MVP, V1, and later.
- `README.md` — project overview and developer setup.
- `docs/accessibility.md` — automated accessibility coverage and the manual screen-reader checklist.
- `docs/decisions/` — decision records (no accounts in the MVP; no analytics in the MVP; launch with illustrations).
- `docs/nutrition-sources.md` — USDA FoodData Central source for every ingredient.
- `docs/dietitian-review.md` — review pack for a registered dietitian (pending).
- `docs/device-testing.md` — real-device install and offline checks (not yet run).
- `docs/content-review.md` — recipe, nutrition, and safety-copy review.
- `docs/deployment.md`, `docs/performance.md`, `docs/launch-checklist.md` — going live.

## License

Proprietary. All rights reserved; see [LICENSE](LICENSE).
