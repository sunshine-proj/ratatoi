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

**Phase 1 (app shell and PWA foundation) complete.** The responsive shell, design tokens, base components, every MVP route (as a placeholder), web app manifest, icons, and an app-shell service worker are in place. Features arrive from Phase 2 onwards. See `ROADMAP.md` for progress and next phases.

## Tech stack

- Next.js 16 (App Router, Turbopack, Cache Components enabled)
- React 19
- TypeScript (strict, plus `noUncheckedIndexedAccess`)
- Tailwind CSS 4
- Zod 4 for validation
- Vitest + React Testing Library for unit/component tests
- Playwright for end-to-end tests
- npm (lockfile committed), Node.js 24 or newer (see `.nvmrc`)

Not yet added: Supabase (Phase 7), React Hook Form (added when complex forms arrive). UI components are hand-written in `components/ui/` rather than pulled from a library.

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
  recipes/ planner/ nutrition/ shopping/
lib/                 Domain logic, kept free of UI code
  i18n/              Translation-ready UI strings (English; Lithuanian-ready)
  validation/        Shared Zod primitives (amounts, servings, dates, slugs)
  navigation.ts      Route table and nav configuration
  nutrition/ recipes/ planner/ shopping/ storage/
data/recipes/        Seed recipe data
assets/              Icon source artwork (SVG)
scripts/             Build-time helpers (icon generation)
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
