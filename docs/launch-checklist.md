# Launch checklist

The MVP features are complete. `npm run launch:check` checks the items below and exits with 1 until none are blocking (CI runs it as an informational job).

## Done

- [x] **Licence:** proprietary, all rights reserved (`LICENSE`; `package.json` `"license": "UNLICENSED"`).
- [x] **Nutrition values** from USDA FoodData Central for every ingredient, with recipes recalculated (`docs/nutrition-sources.md`). Still labelled "Estimated".
- [x] **Imagery:** launching with designed illustrations; licensed photos come after launch (decision 0003).
- [x] **Deploy-ready:** security headers and CSP, HTTPS requirements, and the host checklist in `docs/deployment.md`. CI runs the full suite in Chromium, WebKit, and Firefox.

## Still blocking a public launch

- [ ] **Operator identity and contact:** fill in `config/operator.ts` (name, country, privacy contact email). The privacy notice shows them automatically. A legal review of the notice and the disclaimers is recommended.
- [ ] **Dietitian review:** a registered dietitian works through `docs/dietitian-review.md` and sets its status to Approved.
- [ ] **Deploy over HTTPS** (the product owner does this; see `docs/deployment.md`), then **test on real devices:** Android Chrome, iOS Safari, desktop Chrome or Edge (`docs/device-testing.md`).
- [ ] **Manual screen-reader pass:** VoiceOver, TalkBack, NVDA (`docs/accessibility.md`). The accessibility-tree review is done; this needs real screen readers.

## After going live

- [ ] Lighthouse against the live URL; compare with `docs/performance.md`.
- [ ] Confirm the host's log retention matches the privacy notice.

## Already done (Phases 0–8)

Goals and onboarding, recipe catalogue, planner, progress, and shopping list; versioned local data with migrations; export, import, and delete-everything; offline core pages and editing; privacy notice; security headers and CSP; axe scans with no violations; keyboard, touch-target, contrast, safety-copy, and content checks in CI.
