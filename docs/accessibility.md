# Accessibility

Target: WCAG 2.2 AA for core flows (`PRD.md` §11).

## What is checked automatically

| Check | Where | Notes |
|---|---|---|
| axe (WCAG 2.0–2.2 A/AA + best practice) | `tests/e2e/a11y.spec.ts` | Every route, phone and desktop sizes, plus states: open sheets, validation errors, populated planner and shopping list, onboarding steps. |
| Colour contrast of design tokens | `tests/unit/design/tokens.test.ts` | Every text/background and control/background pair, 4.5:1 text, 3:1 non-text. |
| Keyboard-only flows | `tests/e2e/journey.spec.ts` | Onboarding, day tabs (arrow keys), adding a meal from a sheet, ticking a shopping item. Focus moves to new step headings and returns to a sensible control after sheets close or rows disappear. |
| Focus stays in open dialogs; Escape closes and returns focus | `tests/e2e/journey.spec.ts` | Native `<dialog>`; Tab may reach the browser's own toolbar (allowed), never the page behind. |
| Touch targets ≥ 44 × 44 px | `tests/e2e/journey.spec.ts` | Buttons, links, selects, inputs, disclosures on every core page. Links inside sentences are exempt (WCAG 2.5.8). |
| Accessible names and descriptions | Component tests | e.g. shopping checkboxes are named by their line ("300 g Chicken breast"), with recipes as the description. |

Automated checks catch a useful subset of problems. They do not prove the app works well with a screen reader.

## Accessibility-tree review (2026-11-24)

The accessibility tree is what browsers give screen readers. It was captured with Playwright at phone size for Today, Set up your plan, Recipes, a recipe page, Meal plan, Shopping list, Account and data, and Privacy, then read through by hand. This shows what a screen reader is given, but not how a particular one reads it, so it doesn't replace the manual pass below.

Found and fixed:

- **Account and data:** the hidden file input was a second "Choose a Protein Plate data file" control next to "Restore from a file". It's now `hidden`, so only the visible button is exposed.
- **Phone top bar:** the profile link's icon repeated the link's name ("Profile and goals" twice). The name is now on the link and the icon is decorative.
- **Recipes:** the intro said "photo-led recipes", but recipes show illustrations (decision 0003). Reworded.

Checked and fine: one `h1` per page with a logical heading order; landmarks (banner, main, Main navigation, Notifications); planner tabs announce the full date and meal count; nutrition is in term and definition pairs; radio groups and form fields have names; disabled buttons are exposed as disabled; the footer disclaimer is reachable.

## Manual screen-reader checklist

**Status: not yet run.** Run before public launch, on at least VoiceOver (iOS Safari), TalkBack (Android Chrome), and NVDA (Windows, Firefox or Chrome). Record results in the table below.

For each flow, check that every control is announced with a sensible name and role, that state changes are announced once (not repeatedly), and that nothing important is only visual.

1. **Navigation:** skip link works; main navigation announces the current page; the profile link is reachable.
2. **Onboarding:** each step's heading is announced when it appears; errors are announced with their field; the estimate's working is readable in order.
3. **Recipes:** search results count is announced after typing; filter sheet opens and closes; active-filter chips announce "Remove filter: …"; a recipe page reads in a sensible order (title, labels, times, nutrition, ingredients, method, allergens).
4. **Planner:** day tabs announce the full date and meal count; adding a meal announces the toast; changing servings announces the new value, and the day total is announced once after changes settle; Undo is reachable.
5. **Progress:** each metric reads as "Calories, 1,700 of 1,900 kcal, 200 kcal remaining" (bars are decorative).
6. **Shopping list:** checkboxes read as "450 g Chicken breast, for Ginger chicken stir-fry", and checked state is announced; editing and removing are announced.
7. **Offline:** the offline banner is announced when the connection drops.
8. **Account:** the delete confirmation is announced as a dialog with its description.

| Date | Screen reader + browser | Device | Tester | Result / issues |
|---|---|---|---|---|
| — | VoiceOver + Safari | iPhone | — | Not yet run |
| — | TalkBack + Chrome | Android | — | Not yet run |
| — | NVDA + Firefox | Windows | — | Not yet run |

## Conventions

- Visible labels on every input; hints and errors linked with `aria-describedby`.
- One `:focus-visible` style everywhere; never removed without a replacement.
- Status is never shown by colour alone (text, icons, shapes).
- No red or warning styling for ordinary differences from targets.
- `prefers-reduced-motion` disables animation.
- Live regions are polite and debounced where values change quickly (`components/ui/delayed-announcement.tsx`).
