# Launch checklist

The MVP features are complete. These items remain before a **public** launch.

## Decisions for the product owner

- [ ] **Hosting and domain** (see `docs/deployment.md`). Nothing has been deployed.
- [ ] **Licence** for the code (`package.json` is `private`; no `LICENSE` file).
- [ ] **Operator identity and contact** for the privacy notice (who runs the app, and how to reach them), plus a legal review of the notice and the disclaimers.

## Content

- [ ] Verify ingredient nutrition values against an authoritative food-composition table (values are currently approximate and labelled "Estimated").
- [ ] Add licensed recipe photography (alt text, attribution, and licence are required by the schema).
- [ ] Dietitian review of recipes, targets copy, and the estimate method (`docs/content-review.md`).

## Verification on real devices

- [ ] Install and offline check: Android Chrome, iOS Safari, desktop Chrome/Edge, over HTTPS.
- [ ] Manual screen-reader pass: VoiceOver, TalkBack, NVDA (`docs/accessibility.md`).
- [ ] Lighthouse against the live URL; compare with `docs/performance.md`.

## Already done (Phases 0–8)

Goals and onboarding, recipe catalogue, planner, progress, and shopping list; versioned local data with migrations; export, import, and delete-everything; offline core pages and editing; privacy notice; security headers and CSP; axe scans with no violations; keyboard, touch-target, contrast, safety-copy, and content checks in CI.
