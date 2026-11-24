# 0002 — No analytics in the MVP

- **Status:** Accepted (Phase 8, 2026-11-24)
- **Context:** `PRD.md` §13 lists events that would help evaluate the product. `AGENTS.md` forbids claiming integrations that aren't configured, and asks for privacy-conscious, consent-aware analytics. No analytics provider has been chosen or configured.

## Decision

Ship the MVP with **no analytics and no consent banner**. A consent banner for analytics that don't exist would mislead users.

## Why

- Nothing to configure honestly: no provider, account, or data-processing agreement exists.
- The app's privacy promise ("nothing you enter leaves your device") is simple and true today. The privacy notice says so.
- Several PRD events concern health-related behaviour (targets, food choices), which deserves extra care under GDPR.

## When analytics are added

- Choose a privacy-focused, EU-hosted provider with a data-processing agreement.
- Make it **opt-in**: ask for consent before loading anything, offer "no thanks" as easily as "yes", and let people change their mind in Settings.
- Send event names only, with no free text, no nutrition values or targets, no allergens, and no identifiers beyond what the provider needs.
- Update the privacy notice, the CSP (`connect-src`), and `docs/accessibility.md` (the banner needs testing).
- Candidate events from the PRD: `onboarding_completed`, `nutrition_goal_saved`, `recipe_viewed`, `recipe_added_to_plan`, `recipe_swapped`, `snack_filter_used`, `shopping_list_generated`, `shopping_item_checked`, `plan_week_completed`.
- Success must not be defined by weight loss or calorie restriction (`PRD.md` §13).
