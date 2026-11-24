import { expect, test, type Page } from "@playwright/test";

test.skip(({ isMobile }) => isMobile, "Service-worker checks run in the desktop project only");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-26T10:00:00"));
});

async function waitForWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    }
  });
}

test("core pages open offline even if never visited", async ({ page, context }) => {
  await page.goto("/");
  await waitForWorker(page);
  await context.setOffline(true);
  for (const [path, heading] of [
    ["/planner", "Meal plan"],
    ["/shopping-list", "Shopping list"],
    ["/recipes", "Recipes"],
    ["/settings/account", "Account and data"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
  await context.setOffline(false);
});

test("edit the plan and shopping list offline; changes stay after reconnecting", async ({ page, context }) => {
  await page.goto("/");
  await waitForWorker(page);
  await context.setOffline(true);

  // Client-side navigation while offline.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Plan" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meal plan");
  await expect(page.getByText(/You're offline/)).toBeVisible();

  await page.getByRole("button", { name: "Add snack" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Add Chocolate skyr pot" }).click();
  await expect(page.getByRole("region", { name: "Snacks" }).getByRole("link", { name: "Chocolate skyr pot" })).toBeVisible();

  // A full reload while offline comes from the cache, with the edit intact.
  await page.reload();
  await expect(page.getByRole("region", { name: "Snacks" }).getByRole("link", { name: "Chocolate skyr pot" })).toBeVisible();

  await page.goto("/shopping-list");
  await page.getByRole("button", { name: "Create list from plan" }).click();
  await page.getByRole("checkbox", { name: "200 g Plain skyr" }).check();

  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "200 g Plain skyr" })).toBeChecked();
  await expect(page.getByText(/You're offline/)).toBeHidden();
});
