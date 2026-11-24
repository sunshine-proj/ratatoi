import { expect, test } from "@playwright/test";

// Thursday 26 November 2026, so "today" and the week are predictable.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-26T10:00:00"));
});

test.describe("meal planner", () => {
  test("add a recipe from its card, view it in the plan, and keep it after reload", async ({ page }) => {
    await page.goto("/recipes");
    const results = page.getByRole("region", { name: "Results" });
    await results.getByRole("button", { name: "Add Chocolate skyr pot to plan" }).click();
    await expect(page).toHaveURL("/recipes"); // the card link was not followed

    const sheet = page.getByRole("dialog", { name: "Add Chocolate skyr pot to your plan" });
    await expect(sheet.getByRole("radio", { name: "Snack" })).toBeChecked();
    await sheet.getByLabel("Day").selectOption("2026-11-27");
    await sheet.getByRole("button", { name: "Add to plan" }).click();

    await page.getByRole("button", { name: "View plan" }).click();
    await expect(page).toHaveURL("/planner?date=2026-11-27");
    await expect(page.getByRole("heading", { level: 2, name: /Friday 27 November/ })).toBeVisible();
    const snacks = page.getByRole("region", { name: "Snacks" });
    await expect(snacks.getByRole("link", { name: "Chocolate skyr pot" })).toBeVisible();
    await expect(page.getByText("Planned: 159 kcal · 23 g protein")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("region", { name: "Snacks" }).getByRole("link", { name: "Chocolate skyr pot" })).toBeVisible();
  });

  test("plan a day in the planner, swap a meal, and clear the week", async ({ page }) => {
    await page.goto("/planner");
    await expect(page.getByRole("tab", { name: /Thursday 26 November, Today/ })).toHaveAttribute("aria-selected", "true");

    await page.getByRole("button", { name: "Add breakfast" }).click();
    let sheet = page.getByRole("dialog", { name: "Add breakfast for Thu 26 Nov" });
    await sheet.getByRole("button", { name: "Add Berry yoghurt power bowl" }).click();

    await page.getByRole("button", { name: "Add snack" }).click();
    sheet = page.getByRole("dialog", { name: "Add snack for Thu 26 Nov" });
    await sheet.getByRole("button", { name: "Add Tuna and cucumber bites" }).click();
    await expect(page.getByText("Planned: 539 kcal · 68 g protein")).toBeVisible();

    await page.getByRole("button", { name: "Swap: Berry yoghurt power bowl" }).click();
    sheet = page.getByRole("dialog", { name: "Swap Berry yoghurt power bowl" });
    await expect(sheet.getByText("Day now: 539 kcal · 68 g protein")).toBeVisible();
    await sheet.getByRole("button", { name: "Swap in Spinach and feta egg scramble" }).click();
    await expect(page.getByRole("region", { name: "Breakfast" }).getByRole("link", { name: "Spinach and feta egg scramble" })).toBeVisible();

    // The day tab announces its meals; Friday is still empty.
    await expect(page.getByRole("tab", { name: /Thursday 26 November, Today, 2 meals planned/ })).toBeVisible();
    await page.getByRole("tab", { name: /Friday 27 November/ }).click();
    await expect(page).toHaveURL("/planner?date=2026-11-27");
    await expect(page.getByText(/Nothing planned yet/)).toBeVisible();

    await page.getByRole("button", { name: "Clear week" }).click();
    const confirm = page.getByRole("dialog", { name: "Clear the whole week?" });
    await expect(confirm).toContainText("This removes 2 planned meals from 23 – 29 Nov 2026.");
    await confirm.getByRole("button", { name: "Clear week" }).click();
    await expect(page.getByText("Week cleared.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear week" })).toHaveCount(0);
  });

  test("week navigation and This week", async ({ page }) => {
    await page.goto("/planner");
    await page.getByRole("button", { name: "Next week" }).click();
    await expect(page.getByRole("navigation", { name: "Week of 30 Nov – 6 Dec 2026" })).toBeVisible();
    await page.getByRole("button", { name: "This week" }).click();
    await expect(page.getByRole("navigation", { name: "Week of 23 – 29 Nov 2026" })).toBeVisible();
  });

  test("day tabs fit on a narrow phone without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/planner");
    await expect(page.getByRole("tab")).toHaveCount(7);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const tab of await page.getByRole("tab").all()) {
      const box = await tab.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
