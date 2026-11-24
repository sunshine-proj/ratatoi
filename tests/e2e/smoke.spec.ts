import { expect, test } from "@playwright/test";

test("home page loads with title, language, and heading", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Protein Plate");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Protein Plate");
});
