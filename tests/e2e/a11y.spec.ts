import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Automated WCAG 2.2 A/AA scans with axe. They catch a useful subset of
 * issues (names, roles, contrast, landmarks); they don't replace keyboard
 * and screen-reader testing (see docs/accessibility.md).
 */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
  }));
  expect(summary, `${label}: ${JSON.stringify(summary, null, 2)}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-26T10:00:00"));
});

const routes = [
  "/",
  "/onboarding",
  "/recipes",
  "/recipes/lemon-salmon-traybake",
  "/snacks",
  "/planner",
  "/shopping-list",
  "/settings/goals",
  "/settings/preferences",
  "/settings/account",
  "/offline",
  "/does-not-exist",
];

for (const route of routes) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expectNoViolations(page, route);
  });
}

test("axe: populated planner, open sheets, shopping list, and onboarding steps", async ({ page, isMobile }) => {
  await page.goto("/planner");
  await page.getByRole("button", { name: "Add lunch" }).click();
  await expectNoViolations(page, "add meal sheet");
  await page.getByRole("dialog").getByRole("button", { name: "Add Tuna and chickpea salad" }).click();
  await page.getByRole("button", { name: "Add snack" }).click();
  await page.getByRole("dialog").getByRole("tab", { name: "Your own meal" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Add meal" }).click(); // show validation errors
  await expectNoViolations(page, "custom meal form with errors");
  await page.keyboard.press("Escape");
  await expectNoViolations(page, "planner with a meal");

  await page.getByRole("button", { name: "Swap: Tuna and chickpea salad" }).click();
  await expectNoViolations(page, "swap sheet");
  await page.keyboard.press("Escape");

  await page.goto("/shopping-list");
  await page.getByRole("button", { name: "Create list from plan" }).click();
  await page.getByRole("checkbox").first().check();
  await expectNoViolations(page, "shopping list");

  if (isMobile) {
    await page.goto("/recipes");
    await page.getByRole("button", { name: "Filters" }).click();
    await expectNoViolations(page, "recipe filter sheet");
  }

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Continue" }).click(); // goal required error
  await expectNoViolations(page, "onboarding goal error");
  await page.getByRole("radio", { name: /Build muscle/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expectNoViolations(page, "onboarding profile step");
});
