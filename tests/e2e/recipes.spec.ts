import { expect, test } from "@playwright/test";

test.describe("recipes", () => {
  test("browse, search, and open a recipe", async ({ page }) => {
    await page.goto("/recipes");
    const results = page.getByRole("region", { name: "Results" });
    await expect(results.getByRole("article").first()).toBeVisible();

    await page.getByLabel("Search recipes").fill("prawn");
    await expect(page.getByText("1 recipe", { exact: true })).toBeVisible();
    await results.getByRole("link", { name: "Garlic prawn and courgette pasta" }).click();

    await expect(page).toHaveURL("/recipes/garlic-prawn-courgette-pasta");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garlic prawn and courgette pasta");
    await expect(page.getByRole("region", { name: "Nutrition per serving" })).toContainText("Estimated");
    await expect(page.getByText("Contains: Cereals containing gluten, Crustaceans, Milk.")).toBeVisible();
  });

  test("filters combine and an empty result can be reset", async ({ page, isMobile }) => {
    await page.goto("/recipes");
    if (isMobile) {
      await page.getByRole("button", { name: "Filters" }).click();
      const sheet = page.getByRole("dialog", { name: "Filter recipes" });
      await sheet.getByRole("radio", { name: "Snack" }).check();
      await sheet.getByLabel("Calories at most (kcal)").fill("100");
      await sheet.getByRole("button", { name: /Show 0 recipes/ }).click();
      await expect(sheet).toBeHidden();
    } else {
      const panel = page.getByRole("complementary", { name: "Filters" });
      await panel.getByRole("radio", { name: "Snack" }).check();
      await panel.getByLabel("Calories at most (kcal)").fill("100");
    }
    await expect(page.getByRole("heading", { name: "No recipes match" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove filter: Up to 100 kcal" })).toBeVisible();
    await page.getByRole("region", { name: "Results" }).getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByRole("heading", { name: "No recipes match" })).toBeHidden();
  });

  test("saved allergens are applied by default and can be switched off", async ({ page }) => {
    await page.goto("/settings/preferences");
    await page.getByRole("checkbox", { name: "Fish" }).check();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Preferences saved.")).toBeVisible();

    await page.goto("/recipes");
    const results = page.getByRole("region", { name: "Results" });
    await expect(page.getByText("Hiding: Fish")).toBeVisible();
    await expect(results.getByRole("link", { name: "Lemon salmon and potato traybake" })).toHaveCount(0);

    await page.getByRole("checkbox", { name: "Hide recipes that don't suit my preferences" }).uncheck();
    await expect(results.getByRole("link", { name: "Lemon salmon and potato traybake" })).toBeVisible();
  });

  test("snack presets narrow snacks and stay editable", async ({ page }) => {
    await page.goto("/snacks");
    const results = page.getByRole("region", { name: "Results" });
    await expect(results.getByRole("article")).toHaveCount(7);

    await page.getByRole("radio", { name: "Up to 150 kcal, 15 g+ protein" }).check();
    await expect(results.getByRole("article")).toHaveCount(0);
    await page.getByRole("radio", { name: "Up to 200 kcal, 20 g+ protein" }).check();
    await expect(results.getByRole("link", { name: "Tuna and cucumber bites" })).toBeVisible();
    await expect(results.getByRole("link", { name: "Chocolate skyr pot" })).toBeVisible();
  });

  test("recipe images keep their space while loading (no layout shift)", async ({ page }) => {
    await page.goto("/recipes");
    const ratio = await page
      .getByRole("region", { name: "Results" })
      .getByRole("article")
      .first()
      .evaluate((card) => {
        const frame = card.firstElementChild as HTMLElement;
        const box = frame.getBoundingClientRect();
        return box.width / box.height;
      });
    expect(ratio).toBeCloseTo(4 / 3, 1);
  });
});
