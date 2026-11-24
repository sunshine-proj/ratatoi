import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-26T10:00:00"));
});

async function setTargets(page: import("@playwright/test").Page, kcal: string, protein: string) {
  await page.goto("/settings/goals");
  await page.getByRole("radio", { name: /Lose fat, keep muscle/ }).check();
  await page.getByRole("textbox", { name: "Calories (kcal)" }).fill(kcal);
  await page.getByRole("textbox", { name: "Protein (g)" }).fill(protein);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Targets saved.")).toBeVisible();
}

test.describe("nutrition progress", () => {
  test("planner and Today show progress against targets with neutral wording", async ({ page }) => {
    await setTargets(page, "1900", "150");

    await page.goto("/planner");
    await page.getByRole("button", { name: "Add lunch" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Add Lemon chicken quinoa bowl" }).click();

    const progress = page.getByRole("region", { name: "Progress" });
    await expect(progress).toContainText("524 of 1,900 kcal");
    await expect(progress).toContainText("1,376 kcal remaining");
    await expect(progress).toContainText("46 of 150 g");

    // Four servings: 2,096 kcal → 196 kcal above target, worded neutrally.
    const more = page.getByRole("button", { name: "More servings of Lemon chicken quinoa bowl" });
    for (let i = 0; i < 6; i++) await more.click();
    await expect(progress).toContainText("196 kcal above target");
    await expect(progress).toContainText("35 g above target");

    // The meal row shows chips for the planned servings.
    await expect(page.getByRole("region", { name: "Lunch" })).toContainText("2,096 kcal");

    await page.getByRole("link", { name: "Today", exact: true }).first().click();
    const today = page.getByRole("region", { name: "Today's progress" });
    await expect(today).toContainText("2,096 of 1,900 kcal");
    await expect(page.getByRole("region", { name: "Today's meals" }).getByRole("link", { name: "Lemon chicken quinoa bowl" })).toBeVisible();
  });

  test("week summary uses only the selected week", async ({ page }) => {
    await page.goto("/planner?date=2026-11-23");
    await page.getByRole("button", { name: "Add snack" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Add Chocolate skyr pot" }).click();
    await page.getByRole("tab", { name: /Tuesday 24 November/ }).click();
    await page.getByRole("button", { name: "Add snack" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Add Tuna and cucumber bites" }).click();

    await page.getByText("Week summary").click();
    await expect(page.getByText("Planned this week: 355 kcal · 60 g protein")).toBeVisible();
    await expect(page.getByText("Daily average over 2 planned days: 178 kcal · 30 g protein")).toBeVisible();

    await page.getByRole("button", { name: "Next week" }).click();
    await expect(page.getByText("Nothing planned this week yet.")).toBeAttached();
  });
});
