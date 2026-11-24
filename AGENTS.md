# AGENTS.md — Agentic Development Guide

## Mission

Build a polished, mobile-first Progressive Web App (PWA) for people who want to plan a high-protein diet, discover appealing recipes (including snacks), understand calories and macronutrients, and generate a practical grocery list.

The product should make it easy to answer four questions:

1. What should I eat today and this week?
2. How much protein and energy does each meal provide?
3. What ingredients do I need to buy?
4. Can I swap a meal without breaking my nutrition targets?

Treat this file as the operating contract for AI coding agents and human contributors.

## Product principles

- **Nutrition goals first:** daily calorie and protein targets must be visible and meaningful throughout planning.
- **Food should look appealing:** recipes need prominent photos, useful descriptions, and clear serving information.
- **Snacks are first-class meals:** breakfast, lunch, dinner, and snacks must all be supported in plans and shopping lists.
- **Practical shopping:** aggregate ingredient quantities across the selected plan and avoid duplicate list entries where possible.
- **Honest nutrition:** distinguish verified recipe nutrition from estimates; never imply medical precision.
- **Mobile-first and installable:** core flows must work well on a phone and the app must meet PWA installability requirements.
- **EU-friendly defaults:** metric units, 24-hour time, EUR display where prices are available, and locale-ready text. Do not assume a particular supermarket integration exists.
- **Accessible by default:** keyboard navigation, semantic HTML, sufficient contrast, visible focus, and useful alt text.

## Default technical direction

Unless the repository already establishes a different stack, use:

- Next.js with App Router
- TypeScript with strict mode
- React
- Tailwind CSS
- A small, reusable component system (shadcn/ui is acceptable)
- Zod for runtime validation of user input and API boundaries
- React Hook Form for complex forms
- Supabase (Postgres + Auth + Storage) when a hosted backend is needed
- Vitest or Jest for unit tests and Playwright for end-to-end tests
- A PWA plugin or standards-based service worker and web app manifest
- An image CDN or object storage for recipe images; use licensed/owned assets only

Keep dependencies lean. Do not add a library for a task that can be handled cleanly with existing platform capabilities.

## Working rules for agents

1. **Inspect before changing.** Read the repository structure, package scripts, existing conventions, and relevant files before editing.
2. **Plan non-trivial work.** For multi-file features, state the intended changes and identify acceptance criteria before implementation.
3. **Preserve existing decisions.** Do not replace the framework, styling system, data layer, or package manager without a clear reason.
4. **Small coherent changes.** Prefer focused commits/patches over broad rewrites.
5. **Validate at boundaries.** Validate forms, API payloads, imported recipes, and persisted data with schemas.
6. **No invented integrations.** Do not claim that a supermarket, nutrition database, or AI provider is connected unless it is actually implemented and configured.
7. **No secrets in source.** Use environment variables and update `.env.example` with names and safe placeholders only.
8. **No silent destructive changes.** Migrations must be additive where practical; document data-loss risks.
9. **Keep UI states complete.** Implement loading, empty, error, success, and offline states—not only the happy path.
10. **Update documentation.** When changing setup, environment variables, routes, data models, or major behavior, update README and relevant docs.
11. **Run checks.** Run lint, typecheck, unit tests, and build when available. Report anything not run and why.
12. **Do not fabricate test results.** Clearly distinguish executed checks from recommended checks.

## Feature implementation order

Prioritize the MVP in this sequence:

1. App shell, responsive navigation, design tokens, manifest, installability
2. Onboarding and nutrition goal setup
3. Recipe catalogue, recipe detail, search and filters
4. Day/week meal planner with meal slots and recipe swapping
5. Nutrition summaries and target progress
6. Shopping list generated from the meal plan
7. Persistence, account support, offline behavior, accessibility
8. Polish, analytics consent, optional integrations

Avoid building social feeds, coaching chat, barcode scanning, supermarket checkout, or medical features before the MVP is validated.

## Domain rules

### Nutrition values

- Store nutrition per serving and serving count explicitly.
- Use consistent units: kcal, grams (g), millilitres (ml).
- Protein, carbohydrate, and fat values must be non-negative.
- Calories and macros may not reconcile perfectly because of rounding, fibre, alcohol, and source differences. Do not silently alter source values to force reconciliation.
- Clearly label estimated values.
- Users may set a calorie target, protein target, and optionally carbohydrate/fat targets.
- Do not prescribe targets as medical advice. Explain that targets are estimates and users should consult a qualified professional for medical conditions, pregnancy, eating-disorder history, or other special circumstances.

### Meal planning

- Support meal types: breakfast, lunch, dinner, snack.
- Support multiple snacks per day.
- A recipe can be assigned to a date, meal type, and number of servings.
- Replacing a recipe must recalculate daily totals and the shopping list.
- Users can add custom meals or manually logged foods, but custom entries should not pretend to be verified recipes.

### Shopping list

- Aggregate ingredients by canonical ingredient identity when possible.
- Preserve units and avoid invalid conversions (e.g. do not add grams to millilitres).
- If units cannot safely be combined, show separate lines.
- Let users check off items, edit quantities, add manual items, and group items by category.
- Shopping list generation must be deterministic and reproducible from a plan.

### Recipe images and content

- Only use images with a valid licence, explicit permission, or assets created for the product.
- Store image attribution/licence metadata when required.
- Never scrape images or recipe text from websites in violation of their terms.
- If a recipe has no image, use a designed placeholder rather than a broken image.
- Provide meaningful alt text; decorative imagery should use empty alt text.

## UX and visual direction

- Warm, fresh, modern food-focused visual language.
- Prioritize recipe photography, legible nutrition chips, and clear hierarchy.
- Avoid a clinical medical-dashboard aesthetic.
- Use cards for recipe discovery; use compact rows for shopping lists.
- Keep primary actions reachable on small screens.
- Provide a persistent path to Today, Meal Plan, Recipes, Shopping List, and Profile/Goals.
- Do not rely on colour alone to communicate nutrition status.

## Definition of done

A feature is done only when:

- Acceptance criteria are met.
- Responsive behavior is checked at narrow mobile and desktop widths.
- Keyboard and screen-reader semantics are reasonable.
- Loading, empty, error, and offline behavior are handled where relevant.
- Validation and error messages are clear.
- Tests cover critical business logic.
- Documentation is updated.
- Lint, typecheck, tests, and production build pass—or any failures are explicitly reported.

## Suggested commands

Adapt these to the repository's package manager and scripts:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Agent handoff format

When finishing a task, report:

1. What changed
2. Important implementation decisions
3. Files/routes affected
4. Tests and checks actually run
5. Known limitations or follow-up work

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
