import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", title: "Protein Plate", heading: "Today" },
  { path: "/onboarding", title: "Set up your plan · Protein Plate", heading: "Set up your plan" },
  { path: "/recipes", title: "Recipes · Protein Plate", heading: "Recipes" },
  { path: "/recipes/berry-yoghurt-power-bowl", title: "Berry yoghurt power bowl · Protein Plate", heading: "Berry yoghurt power bowl" },
  { path: "/snacks", title: "Snacks · Protein Plate", heading: "Snacks" },
  { path: "/planner", title: "Meal plan · Protein Plate", heading: "Meal plan" },
  { path: "/shopping-list", title: "Shopping list · Protein Plate", heading: "Shopping list" },
  { path: "/settings/goals", title: "Goals · Protein Plate", heading: "Goals" },
  { path: "/settings/preferences", title: "Preferences · Protein Plate", heading: "Preferences" },
  { path: "/settings/account", title: "Account and data · Protein Plate", heading: "Account and data" },
  { path: "/offline", title: "You're offline · Protein Plate", heading: "You're offline" },
  { path: "/privacy", title: "Privacy · Protein Plate", heading: "Privacy" },
];

test.describe("routes", () => {
  for (const { path, title, heading } of pages) {
    test(`${path} renders one h1 inside main`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      const main = page.getByRole("main");
      await expect(main.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    });
  }

  test("unknown recipes show the not-found page with a real 404", async ({ page }) => {
    const response = await page.goto("/recipes/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL("/recipes/does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("unknown recipes reached by client navigation also show not-found", async ({ page }) => {
    await page.goto("/recipes");
    await page.evaluate(() => {
      const link = document.createElement("a");
      link.href = "/recipes/nope";
      link.textContent = "test link";
      document.querySelector("main")?.append(link);
    });
    await page.getByRole("link", { name: "test link" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("unknown routes show a helpful not-found page", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await page.getByRole("link", { name: "Go to Today" }).click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("navigation", () => {
  test("one main navigation is visible and marks the current page", async ({ page }) => {
    await page.goto("/planner");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toHaveCount(1); // the other layout's nav is display:none
    await expect(nav.getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current");
  });

  test("Today, Plan, Recipes, and Shopping are reachable from any page", async ({ page }) => {
    await page.goto("/settings/account");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [name, url] of [["Plan", "/planner"], ["Recipes", "/recipes"], ["Shopping", "/shopping-list"], ["Today", "/"]] as const) {
      await nav.getByRole("link", { name }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test("profile and goals are always one tap away", async ({ page }) => {
    await page.goto("/recipes");
    await page.getByRole("link", { name: "Profile and goals" }).click();
    await expect(page).toHaveURL("/settings/goals");
    const settings = page.getByRole("navigation", { name: "Settings" });
    await expect(settings.getByRole("link", { name: "Goals" })).toHaveAttribute("aria-current", "page");
    await settings.getByRole("link", { name: "Preferences" }).click();
    await expect(page).toHaveURL("/settings/preferences");
  });

  test("main nav is reachable on the recipe detail route (dynamic params)", async ({ page }) => {
    await page.goto("/recipes/lemon-salmon-traybake");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Recipes" })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("layout", () => {
  test("uses a bottom bar on phones and a sidebar on desktop", async ({ page, isMobile }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    const box = await nav.boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport).toBeTruthy();
    if (isMobile) {
      // Bottom bar: spans the width and sits at the bottom edge.
      expect(box!.width).toBeGreaterThanOrEqual(viewport!.width - 1);
      expect(box!.y + box!.height).toBeGreaterThanOrEqual(viewport!.height - 1);
    } else {
      // Sidebar: on the left (inside its padding), narrower than the content.
      expect(box!.x).toBeLessThan(40);
      expect(box!.width).toBeLessThan(viewport!.width / 3);
    }
  });

  test("never scrolls horizontally", async ({ page }) => {
    for (const path of ["/", "/settings/goals", "/recipes", "/snacks", "/recipes/lean-beef-ragu-wholewheat-pasta"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("nav touch targets are at least 44px", async ({ page }) => {
    await page.goto("/");
    const links = page.getByRole("navigation", { name: "Main" }).getByRole("link");
    for (const link of await links.all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("keyboard", () => {
  test("skip link is the first tab stop and moves focus to main", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard flow is checked at desktop size");
    await page.goto("/planner");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });

  test("focused links show a visible outline", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard flow is checked at desktop size");
    await page.goto("/");
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // brand link
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
    expect(outline.style).toBe("solid");
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  });
});
