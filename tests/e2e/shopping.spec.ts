import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-26T10:00:00"));
});

async function planMeal(page: Page, date: string, slot: string, recipe: string) {
  await page.goto(`/planner?date=${date}`);
  await page.getByRole("button", { name: `Add ${slot}` }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: `Add ${recipe}` }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

test.describe("shopping list", () => {
  test("empty plan shows how to get started", async ({ page }) => {
    await page.goto("/shopping-list");
    await expect(page.getByRole("heading", { name: "Nothing planned for these dates" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your list is empty" })).toBeVisible();
    await page.getByRole("link", { name: "Go to meal plan" }).click();
    await expect(page).toHaveURL("/planner?date=2026-11-23");
  });

  test("create from the plan, tick items, survive reload, and update after plan changes", async ({ page }) => {
    await planMeal(page, "2026-11-26", "dinner", "Ginger chicken stir-fry");
    await planMeal(page, "2026-11-27", "lunch", "Lemon chicken quinoa bowl");

    await page.goto("/shopping-list");
    await expect(page.getByText(/Adds up the ingredients of every planned recipe from 23 – 29 Nov 2026/)).toBeVisible();
    await page.getByRole("button", { name: "Create list from plan" }).click();

    // 1 of 2 servings of each: 150 g + 150 g chicken in one line, from both recipes.
    const chicken = page.getByRole("checkbox", { name: "300 g Chicken breast" });
    await expect(chicken).toHaveAccessibleDescription("For Ginger chicken stir-fry, Lemon chicken quinoa bowl");
    await chicken.check();
    await expect(page.getByText(/^1 of \d+ ticked$/)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("checkbox", { name: "300 g Chicken breast" })).toBeChecked();

    // Double the stir-fry in the plan, then come back.
    await page.goto("/planner?date=2026-11-26");
    const more = page.getByRole("button", { name: "More servings of Ginger chicken stir-fry" });
    await more.click();
    await more.click(); // 1 → 1½ → 2
    await page.getByRole("link", { name: "Shopping", exact: true }).first().click();
    await expect(page.getByText("Your plan has changed since this list was last updated.")).toBeVisible();
    await page.getByRole("button", { name: "Update list from plan" }).nth(1).click();
    await expect(page.getByRole("checkbox", { name: "450 g Chicken breast" })).toBeChecked();
    await expect(page.getByText("Your plan has changed since this list was last updated.")).toBeHidden();
  });

  test("add your own item and choose custom dates", async ({ page }) => {
    await page.goto("/shopping-list");
    await page.getByLabel("Item", { exact: true }).fill("Greek yogurt");
    await page.getByLabel("Amount", { exact: true }).fill("2");
    await page.getByLabel("Unit", { exact: true }).selectOption("pack");
    await page.getByRole("button", { name: "Add item" }).click();
    const dairy = page.getByRole("region", { name: "Dairy and eggs" });
    await expect(dairy.getByRole("checkbox", { name: "2 packs Greek yogurt" })).toBeVisible();

    await page.getByRole("radio", { name: "Choose dates" }).check();
    await page.getByLabel("To", { exact: true }).fill("2026-11-01");
    await expect(page.getByText("The end date must be on or after the start date.")).toBeVisible();
  });

  test("fits a narrow phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await planMeal(page, "2026-11-26", "lunch", "Tuna and chickpea salad");
    await page.goto("/shopping-list");
    await page.getByRole("button", { name: "Create list from plan" }).click();
    await expect(page.getByRole("checkbox").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
