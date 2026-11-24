import { expect, test } from "@playwright/test";

test.describe("onboarding and goals", () => {
  test("new user sets up manually, and targets persist after reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Set up your plan" }).click();
    await expect(page).toHaveURL("/onboarding");

    await page.getByRole("radio", { name: /Lose fat, keep muscle/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Skip, I'll enter my own targets" }).click();

    await page.getByLabel("Calories (kcal)").fill("1,900");
    await page.getByLabel("Protein (g)").fill("150");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("checkbox", { name: "Milk" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { level: 2, name: "Check and save" })).toBeVisible();
    await page.getByRole("button", { name: "Save and finish" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText("You're all set. Your targets are saved.")).toBeVisible();
    // Scope to the accessible tree: Next keeps the previous page mounted but hidden.
    const targets = page.getByRole("list", { name: "Daily targets" });
    await expect(targets).toContainText("1,900 kcal");
    await expect(targets).toContainText("150 g protein");

    await page.reload();
    await expect(page.getByRole("list", { name: "Daily targets" })).toContainText("1,900 kcal");

    await page.goto("/settings/preferences");
    await expect(page.getByRole("checkbox", { name: "Milk" })).toBeChecked();
  });

  test("estimate flow shows its working and keeps profile details out of storage", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("radio", { name: /Build muscle/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Age (years)").fill("40");
    await page.getByLabel("Height (cm)").fill("180");
    await page.getByLabel("Weight (kg)").fill("90");
    await page.getByRole("radio", { name: "Male", exact: true }).check();
    await page.getByRole("radio", { name: /Very active/ }).check();
    await page.getByRole("button", { name: "Estimate my targets" }).click();

    const result = page.getByRole("region", { name: "Your estimated starting point" });
    await expect(result).toContainText("3,450 kcal a day");
    await expect(result).toContainText("160 g protein a day");
    await result.getByRole("button", { name: "Use these targets" }).click();

    await expect(page.getByLabel("Calories (kcal)")).toHaveValue("3450");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Save and finish" }).click();
    await expect(page).toHaveURL("/");

    const stored = await page.evaluate(() => localStorage.getItem("protein-plate:settings"));
    expect(stored).toContain('"dailyCalorieTargetKcal":3450');
    expect(stored).not.toMatch(/"(age|weight|height|sex|activity)/);
  });

  test("finished onboarding starts fresh when you go back to it", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("radio", { name: /Eat more protein/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Skip, I'll enter my own targets" }).click();
    await page.getByLabel("Calories (kcal)").fill("2000");
    await page.getByLabel("Protein (g)").fill("120");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Save and finish" }).click();
    await expect(page).toHaveURL("/");

    // Back restores the hidden, preserved page; it must not reopen the old summary.
    await page.goBack();
    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByRole("heading", { level: 2, name: "What's your goal?" })).toBeVisible();
    await expect(page.getByText(/You've set things up before/)).toBeVisible();
  });

  test("goals form picks up targets changed elsewhere", async ({ page }) => {
    await page.goto("/onboarding");
    // Visit Goals first (client-side) so it stays mounted in the background.
    await page.getByRole("link", { name: "Profile and goals" }).first().click();
    await expect(page).toHaveURL("/settings/goals");
    await expect(page.getByRole("textbox", { name: "Calories (kcal)" })).toHaveValue("");
    await page.goBack();
    await expect(page).toHaveURL("/onboarding");

    await page.getByRole("radio", { name: /Build muscle/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Skip, I'll enter my own targets" }).click();
    await page.getByRole("textbox", { name: "Calories (kcal)" }).fill("2300");
    await page.getByRole("textbox", { name: "Protein (g)" }).fill("150");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Save and finish" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("link", { name: "Edit targets" }).click();
    await expect(page).toHaveURL("/settings/goals");
    await expect(page.getByRole("textbox", { name: "Calories (kcal)" })).toHaveValue("2300");
    await expect(page.getByRole("radio", { name: /Build muscle/ })).toBeChecked();
  });

  test("goals can be edited and cleared from settings", async ({ page }) => {
    await page.goto("/settings/goals");
    await expect(page.getByText(/haven't set any targets yet/)).toBeVisible();

    await page.getByRole("radio", { name: /Eat more protein/ }).check();
    await page.getByLabel("Calories (kcal)").fill("2200");
    await page.getByLabel("Protein (g)").fill("140");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Targets saved.")).toBeVisible();

    await page.getByRole("button", { name: "Clear targets" }).click();
    const dialog = page.getByRole("dialog", { name: "Clear your targets?" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Clear targets" }).click();
    await dialog.getByRole("button", { name: "Clear targets" }).click();
    await expect(page.getByText("Targets cleared.")).toBeVisible();
    await expect(page.getByLabel("Calories (kcal)")).toHaveValue("");
  });

  test("validation errors are announced next to the field", async ({ page }) => {
    await page.goto("/settings/goals");
    await page.getByRole("radio", { name: /Build muscle/ }).check();
    await page.getByLabel("Calories (kcal)").fill("19000");
    await page.getByRole("button", { name: "Save" }).click();
    const calories = page.getByLabel("Calories (kcal)");
    await expect(calories).toBeFocused();
    await expect(calories).toHaveAttribute("aria-invalid", "true");
    await expect(calories).toHaveAccessibleDescription(/Enter a value from 800 to 6,000/);
  });
});
