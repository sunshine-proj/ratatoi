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

**Phase 5 (nutrition summaries and progress) complete.** On top of the app shell, PWA, onboarding and goals, the recipe catalogue (still without photos), and the week planner, users now see their planned intake against their targets: on Today (greeting, date, progress, today's meals including snacks, quick actions) and for every day in the planner, plus a week summary. Per-meal protein and calorie chips appear in the planner and on Today. The shopping list (Phase 6) comes next. See `ROADMAP.md` for progress and next phases.

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
| `npm run test:e2e` | Builds, serves on port 3210, runs Playwright (desktop + mobile Chromium) |
| `npm run icons` | Regenerate PNG icons and favicons from `assets/*.svg` (commit the output) |
| `npm run check` | Lint, typecheck, unit tests, and build in sequence |

Before the first e2e run, install the browser: `npx playwright install chromium`. If port 3210 is taken, set `E2E_PORT`. The e2e run will not reuse a server that is already running on that port.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build, and e2e on every push and pull request.

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
  storage/           Loading / unreadable-data gate shared by settings and the plan
  shopping/
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
  dates.ts           Calendar-date helpers (weeks start Monday)
  ingredients/       Ingredient schema, catalogue, alias index, word matching
  recipes/           Recipe schema, catalogue views, nutrition calculation,
                     labels (tags.ts), filters and sorting, quantity formatting
  navigation.ts      Route table and nav configuration
  shopping/
data/ingredients.ts  Curated ingredient table (nutrition, allergens, aliases, aisle)
data/recipes/        Seed recipes
assets/              Icon source artwork (SVG)
scripts/             Build-time helpers (icon generation)
proxy.ts             Returns a real 404 for unknown recipe slugs
public/sw.js         Service worker
public/icons/        Generated PWA icons
public/images/       Licensed recipe images
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

## Core domain concepts

- **Recipe:** ingredients, instructions, servings, photo metadata, prep time, and nutrition per serving.
- **Nutrition goal:** daily calorie and protein targets, with optional carb and fat targets.
- **Planned meal:** recipe/custom meal, date, meal type, and servings.
- **Meal type:** breakfast, lunch, dinner, or snack. Multiple snacks per day are supported.
- **Shopping list item:** normalized ingredient, quantity, unit, category, checked state, and source references.

Keep nutrition calculations and shopping aggregation in testable domain functions rather than embedding them in UI components.

## Saved data and privacy

Guest mode only; there is no account or server storage yet.

- **Where:** JSON documents in `localStorage`: `protein-plate:settings` (`userSettingsSchema` in `lib/settings/settings.ts`) and `protein-plate:plan` (`mealPlanSchema` in `lib/planner/schema.ts`), each with `version: 1`.
- **What:** goal type; daily calorie and protein targets; optional carbohydrate and fat targets; whether the targets started from an estimate; food preferences (eating pattern, the 14 EU-declared allergens, other excluded ingredients, cooking confidence, budget, meals and snacks per day); and when onboarding was completed.
- **What is never saved:** the age, sex, height, weight, and activity level used for estimates. They exist only in component state while the estimate form is open.
- **Validation:** data is checked against the schema on every read. Damaged or unrecognised data is never trusted: the UI explains the problem and offers to reset. Writes that fail (storage blocked or full) show an error and change nothing.
- **Shared devices:** anyone using the same browser can see this data, and the app says so where it saves. Clearing targets is available in Settings → Goals; export and deletion of all data are planned (Phase 8).

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

## Nutrition progress

- **Logic** (`lib/nutrition/progress.ts`, `lib/nutrition/totals.ts`) is pure and unit-tested, including the PRD scenario (1,900 kcal / 150 g targets, four meals → 1,700 kcal and 150 g planned, 200 kcal and 0 g remaining).
- **Remaining = target − planned.** Negative values are allowed and worded neutrally ("150 kcal above target"); there is no red, no warning styling, and no "over budget" language. A line reads "Planning figures, not a judgement or medical assessment."
- **Rounding:** values are summed at full precision. For display, planned is rounded once and remaining is derived from that rounded figure, so the two numbers shown always add up to the target.
- **Optional targets:** carbohydrate and fat rows appear only if the user set those targets. If any meal lacks that information, the row says "Unknown" instead of showing a partial number.
- **Weekly summary** (planner) covers exactly the selected Monday–Sunday: the week's total and the daily average over *planned* days (days with nothing planned are left out, and the summary says so).
- **Accessibility:** progress bars are decorative; the text beside each bar carries the meaning. Day totals are announced to screen readers through a polite live region that waits until changes settle (`components/ui/delayed-announcement.tsx`), so repeated servings taps produce one announcement.
- **Without targets,** Today and the planner show planned totals and a link to set targets.

## PWA and offline behaviour

**What's in place (Phase 1):**

- `app/manifest.ts`: name, start URL, `display: standalone`, theme/background colours, 192/512 px icons plus a 512 px maskable icon, and Plan/Shopping shortcuts.
- `public/sw.js`, registered in production builds only:
  - Pages: network-first. A cached copy is served when offline, and `/offline` is shown for pages that were never cached.
  - Hashed `/_next/static/` assets: cache-first. Icons and images: stale-while-revalidate.
  - Never cached: non-GET requests, `/api/*`, cross-origin requests, and React Server Component/prefetch requests.
  - On first load, the page sends the worker the assets it has already loaded, so the first visit also works offline.
  - Bump `VERSION` in `sw.js` when you change the caching rules; old caches are deleted when the new worker activates.
- `experimental.useOffline` in `next.config.ts`: Next keeps failed navigations pending and retries them when the connection returns. The offline banner combines Next's `useOffline()` with `navigator.onLine`.
- Security headers on all routes; `/sw.js` is served with `no-cache`.

**Verified by the e2e tests (Chromium):** the manifest and icons are valid and the PNG sizes match, the worker registers and controls the page, Chrome's `Page.getInstallabilityErrors` returns no errors, a visited page reloads offline, and an unvisited page falls back to `/offline`.

**Not yet true, so don't claim it:**

- Only the app shell and pages you've visited are available offline. There are no offline edits yet; persistence and sync come in Phase 7.
- Installation hasn't been tested on iOS Safari or real Android devices. Production must be served over HTTPS (`localhost` is exempt for testing).
- Private data: every route currently renders the same public HTML, and guest data will live in browser storage. If authenticated, user-specific pages are added, they must be excluded from the worker's cache and caches must be cleared on sign-out (see the comment at the top of `sw.js`).

To test the PWA locally, use a production build (`npm run build && npm run start`); the worker isn't registered in `npm run dev`.

## Recipe content and images

Use only original, licensed, or explicitly permitted recipe content and photography. Store attribution and licence metadata where required. Do not scrape recipe sites or images without permission. Provide image alt text and a graceful placeholder for missing images.

### Recipe catalogue

- **Recipes** (`data/recipes/index.ts`) are original recipes written for Protein Plate: 6 breakfasts, 5 lunches, 7 dinners, and 7 snacks (some recipes cover more than one meal), including vegan, vegetarian, fish, and meat dishes, quick ones, and batch-cook ones. They are validated against `recipeSchema` at build time; invalid data fails the build.
- **Ingredients** (`data/ingredients.ts`) are a curated table. Each has a canonical key (used later for shopping-list aggregation), aliases (for search and exclusions, e.g. "zucchini" → courgettes, "shrimp" → prawns), an aisle category, allergens (the 14 EU-declared allergens), what it is made from (plant, dairy, fish…), and approximate nutrition per 100 g.
- **Derived, not typed in:** a recipe's allergens and its vegan/vegetarian/pescatarian suitability are computed from its ingredients, so they can't contradict the ingredient list.
- **Nutrition** per serving is calculated from the ingredient table and stored explicitly in each recipe, labelled *estimated* with its source. `tests/unit/lib/recipe-data.test.ts` fails if a stored value drifts from the calculation. **The per-100 g values are approximate typical values compiled for this project, not taken from or verified against a food-composition database.** Check them against an authoritative source before public launch.
- **Labels** have stated thresholds, shown on each recipe page: *High protein* = at least 20% of energy from protein (the EU condition for the claim); *Under 200 kcal* (snacks) and *Under 450 kcal* (meals) per serving; *Quick* = 15 minutes or less in total; *Batch cook* = marked by the author. Nothing is labelled "low calorie".
- **Photos:** none yet. `image` is `null` and a designed, decorative illustration (tinted by meal type) fills the same 4:3 frame. The schema requires `alt`, `attribution`, and `licence` for any photo added later, and the source section of each recipe page shows them. Recipe text is English only for now.

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

## License

No license has been selected yet. `package.json` is marked `private`. Add a `LICENSE` file before distributing or publishing the project.
