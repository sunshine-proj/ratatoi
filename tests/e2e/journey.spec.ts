import { expect, test, type Locator, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-26T10:00:00"));
});

/** Press Tab until `target` has focus, so the test follows the real tab order. */
async function tabTo(page: Page, target: Locator, max = 120) {
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Could not reach ${target} with Tab`);
}

test("full journey: onboarding → plan meals → add a snack → shopping list", async ({ page }) => {
  // Onboarding with manual targets.
  await page.goto("/");
  await page.getByRole("link", { name: "Set up your plan" }).click();
  await page.getByRole("radio", { name: /Build muscle/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip, I'll enter my own targets" }).click();
  await page.getByRole("textbox", { name: "Calories (kcal)" }).fill("2400");
  await page.getByRole("textbox", { name: "Protein (g)" }).fill("160");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Save and finish" }).click();
  await expect(page).toHaveURL("/");

  // Plan breakfast and dinner from Today's quick action.
  await page.getByRole("navigation", { name: "Quick actions" }).getByRole("link", { name: "Add a meal" }).click();
  await expect(page).toHaveURL("/planner?date=2026-11-26");
  await page.getByRole("button", { name: "Add breakfast" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Add Spinach and feta egg scramble" }).click();
  await page.getByRole("button", { name: "Add dinner" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Add Ginger chicken stir-fry" }).click();

  // Add a snack from the Snacks page.
  await page.goto("/snacks");
  await page.getByRole("region", { name: "Results" }).getByRole("button", { name: "Add Chilli and lemon edamame to plan" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Add to plan" }).click();

  // Today shows progress for all three.
  await page.goto("/");
  const progress = page.getByRole("region", { name: "Today's progress" });
  await expect(progress).toContainText("1,094 of 2,400 kcal"); // 418 + 535 + 141
  await expect(page.getByRole("region", { name: "Today's meals" }).locator("ol > li")).toHaveCount(3);

  // Shopping list from the plan includes the snack's ingredients.
  await page.getByRole("navigation", { name: "Quick actions" }).getByRole("link", { name: "Shopping list" }).click();
  await page.getByRole("button", { name: "Create list from plan" }).click();
  await expect(page.getByRole("checkbox", { name: /Frozen edamame beans/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Chicken breast/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Eggs/ })).toHaveAccessibleDescription(/Spinach and feta egg scramble/);
});

test.describe("keyboard only", () => {
  test.skip(({ isMobile }) => isMobile, "Keyboard flows run at desktop size");

  test("set up, plan a meal, and tick a shopping item without a mouse", async ({ page }) => {
    await page.goto("/onboarding");
    // A radio group is one tab stop; arrow keys choose within it.
    await tabTo(page, page.getByRole("radio", { name: /Lose fat, keep muscle/ }));
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: /Eat more protein/ })).toBeChecked();
    await tabTo(page, page.getByRole("button", { name: "Continue" }));
    await page.keyboard.press("Enter");
    // Focus moves to the new step's heading.
    await expect(page.getByRole("heading", { level: 2, name: "About you" })).toBeFocused();
    await tabTo(page, page.getByRole("button", { name: "Skip, I'll enter my own targets" }));
    await page.keyboard.press("Enter");
    await tabTo(page, page.getByRole("textbox", { name: "Calories (kcal)" }));
    await page.keyboard.type("2000");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("textbox", { name: "Protein (g)" })).toBeFocused();
    await page.keyboard.type("130");
    await page.keyboard.press("Enter"); // submits the step
    await expect(page.getByRole("heading", { level: 2, name: "Food preferences" })).toBeFocused();
    await tabTo(page, page.getByRole("button", { name: "Continue" }));
    await page.keyboard.press("Enter");
    await tabTo(page, page.getByRole("button", { name: "Save and finish" }));
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/");

    await page.goto("/planner");
    // Day tabs: arrow keys move between days.
    await tabTo(page, page.getByRole("tab", { name: /Thursday 26 November/ }));
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: /Friday 27 November/ })).toBeFocused();
    await expect(page).toHaveURL("/planner?date=2026-11-27");
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL("/planner?date=2026-11-26");

    await tabTo(page, page.getByRole("button", { name: "Add lunch" }));
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: /Add lunch/ });
    await expect(dialog).toBeVisible();
    await tabTo(page, dialog.getByRole("button", { name: "Add Lemon chicken quinoa bowl" }));
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    // Focus returns to the slot's "Add lunch" button (the original was replaced).
    await expect(page.getByRole("button", { name: "Add lunch" })).toBeFocused();
    await expect(page.getByRole("region", { name: "Lunch" }).getByRole("link", { name: "Lemon chicken quinoa bowl" })).toBeVisible();

    await page.goto("/shopping-list");
    await tabTo(page, page.getByRole("button", { name: "Create list from plan" }));
    await page.keyboard.press("Enter");
    const chicken = page.getByRole("checkbox", { name: "150 g Chicken breast" });
    await tabTo(page, chicken);
    await page.keyboard.press("Space");
    await expect(chicken).toBeChecked();
  });

  test("dialogs trap focus and close with Escape", async ({ page }) => {
    await page.goto("/settings/account");
    await page.goto("/planner");
    await page.getByRole("button", { name: "Add dinner" }).click();
    const dialog = page.getByRole("dialog");
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      // Inside the dialog, or in the browser's own toolbar (reported as <body>),
      // which native modal dialogs allow; never on the page behind.
      const where = await dialog.evaluate((el) =>
        el.contains(document.activeElement) ? "dialog" : document.activeElement === document.body ? "browser" : "page",
      );
      expect(where).not.toBe("page");
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Add dinner" })).toBeFocused();
  });
});

test("touch targets: controls are at least 44 × 44 px (inline text links excepted)", async ({ page }) => {
  const routes = ["/", "/recipes", "/recipes/chicken-hummus-wraps", "/snacks", "/planner", "/shopping-list", "/settings/goals", "/settings/preferences", "/settings/account", "/onboarding"];
  const small: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const found = await page.evaluate(() => {
      const results: string[] = [];
      const controls = document.querySelectorAll<HTMLElement>(
        "main button, main a[href], main select, main input:not([type=checkbox]):not([type=radio]), main summary, nav a[href], header a[href]",
      );
      for (const el of controls) {
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || el.closest("[hidden], dialog:not([open])")) continue;
        const box = el.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) continue; // not rendered (e.g. sr-only, other layout)
        if (el.closest(".sr-only")) continue;
        // WCAG 2.5.8 exempts links within a sentence.
        if (el.tagName === "A" && el.closest("p")) continue;
        // A link stretched over its card (::after overlay): the card is the target.
        if (getComputedStyle(el, "::after").position === "absolute") {
          const card = el.closest("article") ?? el;
          const cardBox = card.getBoundingClientRect();
          if (cardBox.width >= 44 && cardBox.height >= 44) continue;
        }
        if (box.width < 44 || box.height < 44) {
          results.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}" ${Math.round(box.width)}×${Math.round(box.height)}`);
        }
      }
      return results;
    });
    small.push(...found.map((item) => `${route}: ${item}`));
  }
  expect(small).toEqual([]);
});
