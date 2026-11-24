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

**Planning / implementation-ready specification.** The documents define the product and agent workflow. Update this section as implementation progresses.

## Recommended stack

If the repository does not already use a stack, the recommended default is:

- Next.js App Router
- TypeScript (strict)
- React
- Tailwind CSS
- Zod for validation
- Supabase for optional authentication and hosted persistence
- Vitest for unit tests
- Playwright for end-to-end tests
- PWA manifest and service worker

Keep the stack consistent with the existing repository if implementation has already started.

## Getting started

The exact commands depend on the implementation. For a new Next.js application using npm:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app
npm install
npm run dev
```

Open `http://localhost:3000`.

After scaffolding, add the scripts and dependencies required by the chosen test and PWA setup. Do not assume Supabase or any third-party API is configured until credentials and schema are supplied.

## Environment variables

If Supabase is selected, create `.env.local` and add the values required by the implementation:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never place a service-role key or other secret in a `NEXT_PUBLIC_` variable. Add any server-only secrets without the `NEXT_PUBLIC_` prefix and keep `.env.local` out of version control.

If no hosted backend is configured, the MVP may begin with local persistence and guest mode, provided the limitations are documented.

## Suggested application structure

Adapt this to the repository rather than forcing a rewrite:

```text
app/
  page.tsx
  onboarding/
  recipes/
    page.tsx
    [slug]/
  snacks/
  planner/
  shopping-list/
  settings/
components/
  layout/
  recipes/
  planner/
  nutrition/
  shopping/
lib/
  nutrition/
  recipes/
  planner/
  shopping/
  validation/
  storage/
data/
  recipes/
public/
  icons/
  images/
tests/
  unit/
  e2e/
```

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

## PWA requirements

Before calling the app installable or offline-capable, verify:

- A valid web app manifest exists.
- App icons and theme colours are configured.
- The app is served over HTTPS in production.
- A service worker registers successfully.
- The app shell works offline.
- Offline edits are persisted and synchronized safely, or the UI clearly explains which actions require a connection.
- Private data is not exposed on shared devices.

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

Suggested scripts once configured:

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

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
- `README.md` — project overview and developer setup.

## License

No license has been selected. Add a `LICENSE` file before distributing or publishing the project.
