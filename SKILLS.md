# SKILLS.md — Agent Skills and Workflows

This document defines the capabilities an AI development agent should apply while building and maintaining the Protein Meal Planner PWA.

## 1. Repository orientation

When starting a task:

1. Inspect the project tree and package manager lockfile.
2. Read `README.md`, `AGENTS.md`, `PRD.md`, and this file.
3. Inspect existing routes, components, types, tests, and environment variables.
4. Identify the smallest change that satisfies the request.
5. Check whether a similar component or domain function already exists.
6. Do not assume a backend, API, or integration is configured until verified.

## 2. Product and UX design skill

Use this workflow for new screens or significant UI changes:

1. Identify the user task and its success state.
2. Map the shortest path through the interface.
3. Design mobile layout first, then tablet and desktop.
4. Define loading, empty, error, success, and offline states.
5. Use reusable components and consistent spacing/type scales.
6. Check contrast, focus states, touch target size, and screen-reader labels.
7. Use food photography only when the asset has an appropriate licence and useful alt text.

Design principles:
- Make protein and calories scannable without making the interface feel medical.
- Make snacks as visible as main meals.
- Use plain language (“Add to plan”, “Shopping list”, “Protein today”).
- Avoid shame-based language, red warning states for ordinary target differences, or moral labels such as “good” and “bad” foods.

## 3. TypeScript and architecture skill

- Keep TypeScript strict; avoid `any`.
- Define domain types close to the domain layer, not duplicated in UI components.
- Separate UI, domain calculations, persistence, and external services.
- Keep calculations pure and independently testable.
- Validate untrusted inputs with Zod or the project's existing validation layer.
- Use server-side authorization for private data; never rely only on hiding UI controls.
- Keep environment-specific values in environment variables.

Suggested domain modules:
- `nutrition`: totals, target progress, serving scaling
- `recipes`: search, filters, recipe validation
- `planner`: planned meals, date ranges, meal-slot operations
- `shopping`: ingredient normalization, aggregation, regeneration
- `preferences`: allergens, exclusions, dietary patterns
- `offline`: local persistence, sync queue, conflict handling

## 4. Nutrition calculation skill

Implement nutrition calculations as pure functions.

Required inputs and rules:
- Nutrition per serving: kcal, protein_g, carbs_g, fat_g.
- Planned serving count must be positive.
- Multiply each macro and energy value by planned servings.
- Sum meal values to obtain daily and weekly totals.
- Keep calculations at adequate precision internally; round only for display.
- Treat missing nutrition values as unknown, not zero.
- Mark estimated data as estimated.
- Do not infer nutrition from a recipe title or image.
- Do not make medical recommendations.

Tests should cover:
- One serving
- Fractional servings if supported
- Multiple meals
- Multiple snacks
- Empty day
- Missing nutrition values
- Invalid negative values
- Target above, equal to, and below planned intake

## 5. Recipe data and content skill

When creating or importing recipe data:

- Include a stable ID and slug.
- Include title, short description, meal type, ingredients, quantities, units, steps, servings, prep/cook time, and nutrition per serving.
- Include image URL, alt text, attribution, and licence/source metadata.
- Record whether nutrition is estimated or verified and how it was obtained.
- Record known allergens.
- Keep ingredient names consistent to support shopping aggregation.
- Never fabricate a source or claim a recipe image is licensed without evidence.

Seed data should cover:
- Breakfasts
- Lunches
- Dinners
- At least several high-protein snacks
- Vegetarian options
- A mix of quick and batch-cook recipes

## 6. Recipe search and filtering skill

Filtering should be composable and deterministic.

Supported filters:
- Text search
- Meal type
- Protein minimum per serving
- Calorie maximum per serving
- Preparation-time maximum
- Dietary pattern
- Excluded ingredients/allergens

Use inclusive boundaries (e.g. a recipe with exactly 20 g protein matches a 20 g minimum). Test combined filters and zero-result cases.

## 7. Meal-planning skill

When implementing planner behavior:

- Store dates in a consistent format and handle the user's timezone intentionally.
- Model meal type separately from recipe identity.
- Support multiple snacks per day.
- Support custom meals with explicitly user-entered nutrition.
- Recalculate totals after add, remove, swap, serving change, and date change.
- Preserve plan edits during navigation and refresh.
- Confirm destructive bulk actions.
- Avoid automatically filling every slot if the user has not asked for auto-planning.

## 8. Shopping-list aggregation skill

Use a normalized ingredient representation where practical:

```ts
type Ingredient = {
  id?: string;
  name: string;
  canonicalKey: string;
  quantity: number;
  unit: string;
  category?: string;
};
```

Aggregation workflow:
1. Collect ingredients from every planned recipe in the chosen date range.
2. Scale quantities by planned servings / base recipe servings.
3. Normalize names using a curated alias map, not fuzzy matching alone.
4. Combine only compatible units.
5. Keep incompatible units separate.
6. Assign a category.
7. Attach source references so an item can be traced to its recipes.
8. Merge with manual items and preserve check state on regeneration.

Do not silently convert volume to mass without a reliable ingredient-specific conversion.

Test:
- Same ingredient and same unit
- Ingredient aliases
- Different units
- Fractional quantities
- Changed servings
- Removed recipe
- Manual items
- Checked item preservation
- Empty plan

## 9. PWA and offline skill

For PWA work:

- Provide a valid manifest and correctly sized icons.
- Use HTTPS in deployed environments.
- Verify service worker registration and update behavior.
- Cache the app shell and public assets.
- Cache recipe data only according to freshness and licence rules.
- Treat private plans and profile data carefully on shared devices.
- Provide a visible offline indicator.
- Queue safe mutations locally when offline.
- Retry synchronization with backoff.
- Handle conflicts explicitly; do not silently overwrite newer server data.
- Test installation and offline navigation on supported browsers.

Do not claim full offline support if only the app shell is cached.

## 10. Accessibility skill

For every core flow:
- Use semantic landmarks and heading order.
- Ensure every input has a visible label.
- Ensure buttons have accessible names.
- Provide keyboard access and visible focus.
- Do not use colour as the only status signal.
- Provide alt text for informative recipe photos.
- Respect reduced-motion preferences.
- Check contrast and touch targets.
- Announce dynamic nutrition updates appropriately without excessive screen-reader chatter.

## 11. Security and privacy skill

- Validate and authorize all server-side reads and writes.
- Use row-level security if Supabase is used.
- Do not expose service-role keys to the browser.
- Never commit secrets, tokens, or real user data.
- Collect only profile data needed for the chosen features.
- Provide clear data deletion/export paths before public launch.
- Avoid logging sensitive profile details or meal history unnecessarily.
- Use secure cookies/session handling according to the chosen auth provider.

## 12. Testing skill

Use the project's existing tools. If none exist, propose a lightweight setup before adding dependencies.

Test layers:
- Unit tests: nutrition math, filters, serving scaling, shopping aggregation.
- Component tests: recipe cards, macro summary, planner slots, shopping rows.
- End-to-end tests: onboarding → plan meals → add snack → generate shopping list.
- PWA checks: manifest, service worker, offline shell, installability.
- Accessibility checks: keyboard navigation and automated scans.

Before completing a task, run available:
- Lint
- Typecheck
- Unit tests
- Production build

Report the exact commands and outcomes. Do not claim tests passed if they were not run.

## 13. Documentation skill

Update documentation when:
- Adding/removing environment variables
- Changing setup commands
- Adding routes or major flows
- Changing the data model
- Adding external services
- Changing offline behavior
- Adding migrations or deployment steps

Keep README setup instructions aligned with the actual repository.

## 14. Feature completion checklist

- [ ] Matches the relevant PRD requirements
- [ ] Mobile-first responsive behavior
- [ ] Loading, empty, error, and offline states considered
- [ ] Form and API validation
- [ ] Authorization and privacy reviewed
- [ ] Unit/integration tests added where appropriate
- [ ] Accessibility reviewed
- [ ] Documentation updated
- [ ] Lint/typecheck/tests/build run or limitations reported
